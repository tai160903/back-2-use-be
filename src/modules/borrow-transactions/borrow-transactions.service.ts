import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreateBorrowTransactionDto } from './dto/create-borrow-transaction.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { BorrowTransaction } from './schemas/borrow-transactions.schema';
import { Model, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Users } from '../users/schemas/users.schema';
import { Customers } from '../users/schemas/customer.schema';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import * as QRCode from 'qrcode';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Wallets } from '../wallets/schemas/wallets.schema';
import {
  WalletTransactions,
  WalletTransactionsDocument,
} from '../wallet-transactions/schema/wallet-transactions.schema';
import { TransactionType } from 'src/common/constants/transaction-type.enum';
import { Product } from '../products/schemas/product.schema';
import { ProductSize } from '../product-sizes/schemas/product-size.schema';
import { Businesses } from '../businesses/schemas/businesses.schema';

@Injectable()
export class BorrowTransactionsService {
  constructor(
    @InjectModel(BorrowTransaction.name)
    private readonly borrowTransactionModel: Model<BorrowTransaction>,
    @InjectModel(Users.name) private readonly userModel: Model<Users>,
    @InjectModel(Customers.name)
    private readonly customerModel: Model<Customers>,
    @InjectModel(Wallets.name) private readonly walletsModel: Model<Wallets>,
    @InjectModel(WalletTransactions.name)
    private readonly walletTransactionsModel: Model<WalletTransactionsDocument>,
    @InjectModel(Product.name) private readonly productModel: Model<Product>,
    private readonly cloudinaryService: CloudinaryService,
    @InjectModel(ProductSize.name)
    private readonly productSizeModel: Model<ProductSize>,
    @InjectModel(Businesses.name)
    private readonly businessesModel: Model<Businesses>,
  ) {}

  async createBorrowTransaction(
    dto: CreateBorrowTransactionDto,
    userId: string,
  ): Promise<APIResponseDto> {
    const session = await this.borrowTransactionModel.db.startSession();
    session.startTransaction();
    try {
      const user = await this.userModel.findById(userId).session(session);
      if (!user)
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);

      const customer = await this.customerModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .session(session);
      if (!customer)
        throw new HttpException('Customer not found', HttpStatus.BAD_REQUEST);

      const product = await this.productModel
        .findById(dto.productId)
        .session(session);

      if (!product)
        throw new HttpException('Product not found', HttpStatus.BAD_REQUEST);

      if (product.businessId?.toString() !== dto.businessId?.toString())
        throw new HttpException(
          'Product does not belong to the specified business',
          HttpStatus.BAD_REQUEST,
        );

      if (product.status !== 'available')
        throw new HttpException(
          'Product is not available for borrowing',
          HttpStatus.BAD_REQUEST,
        );

      const productSize = await this.productSizeModel
        .findById(product.productSizeId)
        .session(session);

      if (dto.depositValue !== productSize?.depositValue)
        throw new HttpException(
          'Invalid deposit value',
          HttpStatus.BAD_REQUEST,
        );

      const borrowDate = new Date();
      const dueDate = new Date(borrowDate);
      dueDate.setDate(borrowDate.getDate() + dto.durationInDays);

      const { depositValue, durationInDays, type } = dto;
      const depositAmount =
        (Math.round(Number(depositValue) * 100) * Number(durationInDays)) / 100;

      const customerWallet = await this.walletsModel
        .findOne({ userId: user._id, type: 'customer' })
        .session(session);

      if (!customerWallet)
        throw new HttpException(
          'Customer wallet not found',
          HttpStatus.NOT_FOUND,
        );

      if (customerWallet.availableBalance < depositAmount)
        throw new HttpException(
          'Insufficient wallet balance',
          HttpStatus.BAD_REQUEST,
        );

      const business = await this.businessesModel
        .findById(dto.businessId)
        .session(session);

      if (!business)
        throw new HttpException('Business not found', HttpStatus.NOT_FOUND);

      const businessWallet = await this.walletsModel
        .findOne({ userId: business.userId, type: 'business' })
        .session(session);

      const status = type === 'online' ? 'pending_pickup' : 'borrowing';

      const [transaction] = await this.borrowTransactionModel.create(
        [
          {
            productId: new Types.ObjectId(dto.productId),
            businessId: new Types.ObjectId(dto.businessId),
            borrowDate,
            dueDate,
            depositAmount,
            customerId: customer._id,
            status,
          },
        ],
        { session },
      );

      const qrCodeData = await QRCode.toDataURL(transaction._id.toString());
      const uploadResult = await this.cloudinaryService.uploadQRCode(
        Buffer.from(qrCodeData.split(',')[1], 'base64'),
        transaction._id.toString(),
        'borrow-transactions/qrcodes',
      );

      transaction.qrCode = uploadResult.secure_url as string;

      customerWallet.availableBalance -= depositAmount;
      customerWallet.holdingBalance += depositAmount;

      const walletCustomer = new this.walletTransactionsModel({
        walletId: customerWallet._id,
        relatedUserId: user._id,
        relatedUserType: 'customer',
        amount: depositAmount,
        transactionType: TransactionType.BORROW_DEPOSIT,
        direction: 'out',
        status: 'completed',
        description: 'Deposit for borrow transaction',
        referenceType: 'borrow',
        referenceId: transaction._id,
        fromBalanceType: 'available',
      });

      await walletCustomer.save({ session });

      if (!businessWallet) {
        throw new HttpException(
          'Business wallet not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const walletBusiness = new this.walletTransactionsModel({
        walletId: businessWallet._id,
        relatedUserId: user._id,
        relatedUserType: 'customer',
        amount: depositAmount,
        transactionType: TransactionType.BORROW_DEPOSIT,
        direction: 'in',
        status: 'completed',
        description: 'Deposit received for borrow transaction',
        referenceType: 'borrow',
        referenceId: transaction._id,
        fromBalanceType: 'available',
      });

      await walletBusiness.save({ session });

      await this.productModel.updateOne(
        { _id: product._id },
        { status: 'non-available' },
        { session },
      );

      await Promise.all([
        transaction.save({ session }),
        customerWallet.save({ session }),
      ]);

      await session.commitTransaction();

      return {
        statusCode: HttpStatus.CREATED,
        message: `Borrow transaction created successfully`,
        data: transaction,
      };
    } catch (error) {
      await session.abortTransaction();
      throw new HttpException(
        (error as Error).message || 'Failed to create borrow transaction',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      await session.endSession();
    }
  }

  async confirmBorrowTransaction(
    transactionId: string,
  ): Promise<APIResponseDto> {
    try {
      const transaction =
        await this.borrowTransactionModel.findById(transactionId);

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      if (transaction.status !== 'pending_pickup') {
        throw new HttpException(
          'Only transactions with status "pending_pickup" can be confirmed.',
          HttpStatus.BAD_REQUEST,
        );
      }

      transaction.status = 'borrowing';
      await transaction.save();

      return {
        statusCode: HttpStatus.OK,
        message: 'Transaction confirmed successfully.',
        data: transaction,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'Failed to confirm transaction.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getCustomerTransactionHistory(userId: string): Promise<APIResponseDto> {
    try {
      const customer = await this.customerModel.findOne({
        userId: new Types.ObjectId(userId),
      });
      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
      }
      const transactions = await this.borrowTransactionModel.find({
        customerId: new Types.ObjectId(customer._id),
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Customer transaction history fetched successfully.',
        data: transactions,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message ||
          'Failed to fetch customer transaction history.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getBusinessPendingTransactions(
    businessId: string,
  ): Promise<APIResponseDto> {
    try {
      const transactions = await this.borrowTransactionModel.find({
        businessId: new Types.ObjectId(businessId),
        status: 'pending_pickup',
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Pending transactions for business fetched successfully.',
        data: transactions,
      };
    } catch (error) {
      throw new HttpException(
        (error as Error).message ||
          'Failed to fetch pending transactions for business.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Cron(CronExpression.EVERY_MINUTE, { timeZone: 'Asia/Ho_Chi_Minh' })
  async cancelExpiredBorrowTransactions() {
    const now = new Date();
    const expiredTransactions = await this.borrowTransactionModel.find({
      status: 'pending_pickup',
      borrowDate: { $lte: new Date(now.getTime() - 2 * 60 * 60 * 1000) },
    });

    for (const transaction of expiredTransactions) {
      try {
        const customer = await this.customerModel.findById(
          transaction.customerId,
        );
        if (!customer) {
          throw new HttpException('Customer not found', HttpStatus.NOT_FOUND);
        } else {
          const userId = customer.userId;
          const wallet = await this.walletsModel.findOne({
            userId,
            type: 'customer',
          });
          if (!wallet) {
            throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
          } else {
            const amount = transaction.depositAmount || 0;
            wallet.holdingBalance = Math.max(0, wallet.holdingBalance - amount);
            wallet.availableBalance += amount;
            await wallet.save();

            await this.walletTransactionsModel.create({
              walletId: wallet._id,
              relatedUserId: userId,
              relatedUserType: 'customer',
              amount,
              transactionType: TransactionType.RETURN_REFUND,
              direction: 'in',
              status: 'completed',
              description:
                'Refund deposit due to uncollected borrow (auto-cancel)',
              referenceType: 'borrow',
              referenceId: transaction._id,
              fromBalanceType: 'available',
            });
          }
        }

        transaction.status = 'canceled';
        await transaction.save();
      } catch (error) {
        throw new HttpException(
          (error as Error).message || 'Error cancelling expired transaction',
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
