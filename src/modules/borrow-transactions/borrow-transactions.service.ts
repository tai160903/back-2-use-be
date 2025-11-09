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
    private readonly cloudinaryService: CloudinaryService,
  ) {}

  async createBorrowTransaction(
    createBorrowTransactionDto: CreateBorrowTransactionDto,
    userId: string,
  ): Promise<APIResponseDto> {
    const session = await this.borrowTransactionModel.db.startSession();
    session.startTransaction();
    try {
      const user = await this.userModel.findById(userId).session(session);

      if (!user) {
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }

      const customer = await this.customerModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .session(session);

      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.BAD_REQUEST);
      }

      const borrowDate = new Date();
      const dueDate = new Date(borrowDate);
      dueDate.setDate(
        borrowDate.getDate() + createBorrowTransactionDto.durationInDays,
      );

      const depositValue: number = createBorrowTransactionDto.depositValue;
      const durationInDays: number = createBorrowTransactionDto.durationInDays;
      if (
        depositValue == null ||
        durationInDays == null ||
        Number.isNaN(Number(depositValue)) ||
        Number.isNaN(Number(durationInDays)) ||
        durationInDays <= 0
      ) {
        throw new HttpException(
          'Invalid depositValue or durationInDays',
          HttpStatus.BAD_REQUEST,
        );
      }
      const depositAmount =
        (Math.round(Number(depositValue) * 100) * Number(durationInDays)) / 100;

      const customerWallet = await this.walletsModel
        .findOne({ userId: user._id, type: 'customer' })
        .session(session);

      if (!customerWallet) {
        throw new HttpException(
          'Customer wallet not found',
          HttpStatus.NOT_FOUND,
        );
      }

      if (customerWallet.availableBalance < depositAmount) {
        throw new HttpException(
          'Insufficient wallet balance for deposit',
          HttpStatus.BAD_REQUEST,
        );
      }

      const newTransaction = await this.borrowTransactionModel.create([
        {
          productId: createBorrowTransactionDto.productId,
          businessId: createBorrowTransactionDto.businessId,
          borrowDate,
          dueDate,
          depositAmount,
          customerId: customer._id,
          status: 'borrowing',
        },
      ]);

      const qrCodeData = await QRCode.toDataURL(
        newTransaction[0]._id.toString(),
      );

      const uploadResult = await this.cloudinaryService.uploadQRCode(
        Buffer.from(qrCodeData.split(',')[1], 'base64'),
        newTransaction[0]._id.toString(),
        'borrow-transactions/qrcodes',
      );

      newTransaction[0].qrCode = uploadResult.secure_url as string;

      customerWallet.availableBalance -= depositAmount;
      customerWallet.holdingBalance += depositAmount;

      const walletTx = new this.walletTransactionsModel({
        walletId: customerWallet._id,
        relatedUserId: user._id,
        relatedUserType: 'customer',
        amount: depositAmount,
        transactionType: TransactionType.BORROW_DEPOSIT,
        direction: 'out',
        status: 'completed',
        description: 'Deposit for borrow transaction',
        referenceType: 'borrow',
        referenceId: newTransaction[0]._id,
        fromBalanceType: 'available',
      });

      await Promise.all([
        newTransaction[0].save({ session }),
        customerWallet.save({ session }),
        walletTx.save({ session }),
      ]);

      await session.commitTransaction();

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Borrow transaction created successfully',
        data: newTransaction[0],
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

  async createOnlineBorrowTransaction(
    createBorrowTransactionDto: CreateBorrowTransactionDto,
    userId: string,
  ): Promise<APIResponseDto> {
    const session = await this.borrowTransactionModel.db.startSession();
    session.startTransaction();
    try {
      const user = await this.userModel.findById(userId).session(session);
      if (!user) {
        throw new HttpException('User not found', HttpStatus.BAD_REQUEST);
      }

      const customer = await this.customerModel
        .findOne({ userId: new Types.ObjectId(userId) })
        .session(session);
      if (!customer) {
        throw new HttpException('Customer not found', HttpStatus.BAD_REQUEST);
      }

      const customerWallet = await this.walletsModel
        .findOne({ userId: user._id, type: 'customer' })
        .session(session);
      if (!customerWallet) {
        throw new HttpException(
          'Customer wallet not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const borrowDate = new Date();
      const dueDate = new Date(borrowDate);
      dueDate.setDate(
        borrowDate.getDate() + createBorrowTransactionDto.durationInDays,
      );

      const depositValue: number = createBorrowTransactionDto.depositValue;
      const durationInDays: number = createBorrowTransactionDto.durationInDays;
      if (
        depositValue == null ||
        durationInDays == null ||
        Number.isNaN(Number(depositValue)) ||
        Number.isNaN(Number(durationInDays)) ||
        durationInDays <= 0
      ) {
        throw new HttpException(
          'Invalid depositValue or durationInDays',
          HttpStatus.BAD_REQUEST,
        );
      }
      const depositAmount =
        (Math.round(Number(depositValue) * 100) * Number(durationInDays)) / 100;
      if (customerWallet.availableBalance < depositAmount) {
        throw new HttpException(
          'Insufficient wallet balance for deposit',
          HttpStatus.BAD_REQUEST,
        );
      }

      const newTransaction = await this.borrowTransactionModel.create([
        {
          productId: createBorrowTransactionDto.productId,
          businessId: createBorrowTransactionDto.businessId,
          borrowDate,
          dueDate,
          depositAmount,
          customerId: customer._id,
          status: 'pending_pickup',
        },
      ]);

      const qrCodeData = await QRCode.toDataURL(
        newTransaction[0]._id.toString(),
      );

      const uploadResult = await this.cloudinaryService.uploadQRCode(
        Buffer.from(qrCodeData.split(',')[1], 'base64'),
        newTransaction[0]._id.toString(),
        'borrow-transactions/qrcodes',
      );

      newTransaction[0].qrCode = uploadResult.secure_url as string;

      customerWallet.availableBalance -= depositAmount;
      customerWallet.holdingBalance += depositAmount;

      const walletTx = new this.walletTransactionsModel({
        walletId: customerWallet._id,
        relatedUserId: user._id,
        relatedUserType: 'customer',
        amount: depositAmount,
        transactionType: TransactionType.BORROW_DEPOSIT,
        direction: 'out',
        status: 'completed',
        description: 'Deposit for online borrow transaction',
        referenceType: 'borrow',
        referenceId: newTransaction[0]._id,
        fromBalanceType: 'available',
      });

      await Promise.all([
        newTransaction[0].save({ session }),
        customerWallet.save({ session }),
        walletTx.save({ session }),
      ]);

      await session.commitTransaction();

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Online borrow transaction created successfully',
        data: newTransaction[0],
      };
    } catch (error) {
      await session.abortTransaction();
      throw new HttpException(
        (error as Error).message ||
          'Failed to create online borrow transaction',
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

  async getCustomerTransactionHistory(
    customerId: string,
  ): Promise<APIResponseDto> {
    try {
      const transactions = await this.borrowTransactionModel.find({
        customerId: new Types.ObjectId(customerId),
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
