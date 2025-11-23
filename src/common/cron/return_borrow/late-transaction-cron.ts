import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import {
  BorrowTransaction,
  BorrowTransactionDocument,
} from 'src/modules/borrow-transactions/schemas/borrow-transactions.schema';

import {
  Product,
  ProductDocument,
} from 'src/modules/products/schemas/product.schema';

import {
  Wallets,
  WalletsDocument,
} from 'src/modules/wallets/schemas/wallets.schema';

import {
  WalletTransactions,
  WalletTransactionsDocument,
} from 'src/modules/wallet-transactions/schema/wallet-transactions.schema';

import { TransactionType } from 'src/common/constants/transaction-type.enum';
import {
  BusinessDocument,
  Businesses,
} from 'src/modules/businesses/schemas/businesses.schema';
import { applyEcoPointChange } from 'src/modules/borrow-transactions/helpers/apply-eco-point-change.helper';
import { applyRewardPointChange } from 'src/modules/borrow-transactions/helpers/apply-reward-points-change.helper';
import {
  Customers,
  CustomersDocument,
} from 'src/modules/users/schemas/customer.schema';
import {
  ProductGroup,
  ProductGroupDocument,
} from 'src/modules/product-groups/schemas/product-group.schema';
import {
  ProductSize,
  ProductSizeDocument,
} from 'src/modules/product-sizes/schemas/product-size.schema';
import {
  Material,
  MaterialDocument,
} from 'src/modules/materials/schemas/material.schema';

@Injectable()
export class LateTransactionCron {
  private readonly logger = new Logger(LateTransactionCron.name);

  constructor(
    @InjectModel(BorrowTransaction.name)
    private readonly borrowTransactionModel: Model<BorrowTransactionDocument>,

    @InjectModel(ProductGroup.name)
    private readonly productGroupModel: Model<ProductGroupDocument>,

    @InjectModel(ProductSize.name)
    private readonly productSizeModel: Model<ProductSizeDocument>,

    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    @InjectModel(Wallets.name)
    private readonly walletModel: Model<WalletsDocument>,

    @InjectModel(WalletTransactions.name)
    private readonly walletTransactionsModel: Model<WalletTransactionsDocument>,

    @InjectModel(Businesses.name)
    private readonly businessModel: Model<BusinessDocument>,

    @InjectModel(Customers.name)
    private readonly customerModel: Model<CustomersDocument>,

    @InjectModel(Material.name)
    private readonly materialModel: Model<MaterialDocument>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleLateTransactions() {
    this.logger.log('Running late transaction cron...');

    const borrowPolicy = await this.borrowTransactionModel.db
      .collection('systemsettings')
      .findOne({ category: 'borrow', key: 'borrow_policy' });

    if (!borrowPolicy) {
      this.logger.warn('⚠️ No borrow policy found → skip cron');
      return;
    }

    const { maxDaysLateAllowed } = borrowPolicy.value;
    this.logger.log(
      `Borrow policy loaded → maxDaysLateAllowed = ${maxDaysLateAllowed} (minutes)`,
    );

    const now = new Date();

    const transactions = await this.borrowTransactionModel.find({
      status: 'borrowing',
      isLateProcessed: false,
    });

    this.logger.log(
      `Found ${transactions.length} active borrowing transactions`,
    );

    for (const tx of transactions) {
      this.logger.log(
        `Checking transaction ${tx._id} | product ${tx.productId} | customer ${tx.customerId}`,
      );

      const msLate = now.getTime() - new Date(tx.dueDate).getTime();
      const lateDays = Math.floor(msLate / (1000 * 60));

      this.logger.log(
        `→ dueDate = ${tx.dueDate.toISOString()} | now = ${now.toISOString()}`,
      );
      this.logger.log(`→ lateMinutes = ${lateDays}`);

      if (lateDays <= 0) {
        this.logger.log(`→ NOT LATE. Skipping.`);
        continue;
      }

      if (lateDays > maxDaysLateAllowed) {
        this.logger.warn(
          `⚠️ Transaction ${tx._id} is OVERDUE (${lateDays} > ${maxDaysLateAllowed}). Processing as LOST.`,
        );
        await this.processOverdue(tx);
      } else {
        this.logger.log(
          `→ LATE but within limit (${lateDays}/${maxDaysLateAllowed}). No forfeiture.`,
        );
      }
    }

    this.logger.log('Late transaction cron completed.');
  }

  //   PROCESS OVERDUE TRANSACTION
  async processOverdue(borrowTransaction: BorrowTransactionDocument) {
    this.logger.warn(
      `🚨 Start overdue processing for transaction ${borrowTransaction._id}`,
    );

    const session = await this.borrowTransactionModel.startSession();
    session.startTransaction();

    try {
      // 1️⃣ Load product to verify existence + update status later
      const product = await this.productModel
        .findById(borrowTransaction.productId)
        .session(session);

      if (!product) throw new Error('Product not found');

      // 2️⃣ Get business owner (to return deposit to business wallet)
      const business = await this.businessModel
        .findById(new Types.ObjectId(borrowTransaction.businessId))
        .session(session);

      if (!business) throw new Error('Business not found');

      const businessWallet = await this.walletModel
        .findOne({
          userId: business.userId,
          type: 'business',
        })
        .session(session);

      if (!businessWallet) throw new Error('Business wallet not found');

      // 3️⃣ Deposit forfeiture logic
      // Chuyển tiền từ holding → available của business
      const deposit = borrowTransaction.depositAmount;
      businessWallet.holdingBalance -= deposit;
      businessWallet.availableBalance += deposit;

      await new this.walletTransactionsModel({
        walletId: businessWallet._id,
        relatedUserId: borrowTransaction.customerId,
        relatedUserType: 'customer',
        amount: deposit,
        transactionType: TransactionType.DEPOSIT_FORFEITED,
        direction: 'in',
        balanceType: 'holding',
        toBalanceType: 'available',
        description: 'Deposit forfeited due to overdue return',
        status: 'completed',
        referenceType: 'borrow',
        referenceId: borrowTransaction._id,
      }).save({ session });

      await businessWallet.save({ session });

      // 4️⃣ Mark product as lost
      // Do not allow the item to return to inventory
      product.condition = 'lost';
      product.status = 'non-available';
      await product.save({ session });

      // 5️⃣ Load customer (needed for reward points)
      const customer = await this.customerModel
        .findById(borrowTransaction.customerId)
        .session(session);

      if (!customer) throw new Error('Customer not found');

      // 6️⃣ Load product group info → Needed for eco point calculation
      const productGroup = await this.productGroupModel
        .findById(product.productGroupId)
        .session(session);

      if (!productGroup) {
        throw new Error(`Product group not found for product ${product._id}`);
      }

      const productSize = await this.productSizeModel
        .findById(product.productSizeId)
        .session(session);

      if (!productSize) {
        throw new Error(`Product size not found for product ${product._id}`);
      }

      const material = await this.materialModel
        .findById(productGroup.materialId)
        .session(session);

      if (!material) {
        throw new Error(
          `Material not found for productGroup ${productGroup._id}`,
        );
      }

      // 7️⃣ Load reward policy (from system settings)
      const rewardPolicyDoc = await this.borrowTransactionModel.db
        .collection('systemsettings')
        .findOne({ category: 'reward', key: 'reward_policy' });

      if (!rewardPolicyDoc) {
        throw new Error(`Reward policy system setting not found`);
      }

      const rewardPolicy = rewardPolicyDoc.value;

      // 8️⃣ Apply reward point penalty for customer (return_failed logic)
      const rewardResult = applyRewardPointChange(
        customer,
        'lost',
        rewardPolicy,
      );

      borrowTransaction.rewardPointChanged = rewardResult.addedRewardPoints;
      borrowTransaction.rankingPointChanged = rewardResult.addedRankingPoints;

      await this.customerModel.updateOne(
        { _id: customer._id },
        {
          $inc: {
            rewardPoints: rewardResult.addedRewardPoints,
            rankingPoints: rewardResult.addedRankingPoints,
            returnFailedCount: 1,
          },
        },
        { session },
      );

      // 9️⃣ Apply eco point for business (because lost → negative eco impact)
      const ecoResult = applyEcoPointChange(
        business,
        productSize,
        material,
        'lost',
      );

      borrowTransaction.ecoPointChanged = ecoResult.addedEcoPoints;
      borrowTransaction.co2Changed = ecoResult.addedCo2;

      await this.businessModel.updateOne(
        { _id: business._id },
        {
          $inc: {
            ecoPoints: ecoResult.addedEcoPoints,
            co2Reduced: ecoResult.addedCo2,
          },
        },
        { session },
      );

      // 🔟 Update transaction as LOST
      borrowTransaction.status = 'lost';
      borrowTransaction.borrowTransactionType = 'return_failed';
      borrowTransaction.isLateProcessed = true;
      await borrowTransaction.save({ session });

      await session.commitTransaction();
      this.logger.log(`🎉 Overdue processing completed successfully.`);
    } catch (error) {
      await session.abortTransaction();
      this.logger.error(
        `❌ Error processing overdue transaction ${borrowTransaction._id}: ${error.message}`,
      );
      throw error;
    } finally {
      session.endSession();
    }
  }
}
