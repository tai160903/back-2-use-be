import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallets, WalletsDocument } from './schemas/wallets.schema';
import { MomoService } from '../../infrastructure/momo/momo.service';
import { VnpayService } from '../../infrastructure/vnpay/vnpay.service';
import { Request } from 'express';
import { WalletTransactions } from '../wallet-transactions/schema/wallet-transactions.schema';
import { TransactionType } from 'src/common/constants/transaction-type.enum';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { PaymentMethod } from './dto/deposit-wallet.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/authenticated-request.interface';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallets.name) private walletsModel: Model<Wallets>,
    @InjectModel(WalletTransactions.name)
    private transactionsModel: Model<WalletTransactions>,
    private readonly notificationsService: NotificationsService,
    private readonly momoService: MomoService,
    private readonly vnpayService: VnpayService,
  ) {}

  async create(createWalletDto: CreateWalletDto): Promise<APIResponseDto> {
    try {
      const { userId } = createWalletDto;
      const existingWallet = await this.walletsModel.findOne({
        userId: userId,
      });
      if (existingWallet) {
        throw new HttpException(
          'Wallet already exists for this user',
          HttpStatus.BAD_REQUEST,
        );
      }
      const wallet = await this.walletsModel.create({
        userId: new Types.ObjectId(createWalletDto.userId),
        type: createWalletDto.type,
        availableBalance: createWalletDto.availableBalance,
        holdingBalance: createWalletDto.holdingBalance,
      });
      return {
        statusCode: HttpStatus.CREATED,
        message: 'Wallet created successfully',
        data: wallet,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = (error as Error)?.message || 'Error creating wallet';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async findOne(id: string): Promise<APIResponseDto> {
    try {
      const wallet = await this.walletsModel.findById(id);
      if (!wallet) {
        throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
      }
      return {
        statusCode: HttpStatus.OK,
        message: 'Wallet retrieved successfully',
        data: wallet,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = (error as Error)?.message || 'Error retrieving wallet';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async update(
    id: string,
    updateWalletDto: UpdateWalletDto,
  ): Promise<APIResponseDto> {
    try {
      const wallet = await this.walletsModel.findById(id);
      if (!wallet) {
        throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
      }
      if (updateWalletDto.availableBalance !== undefined) {
        wallet.availableBalance = updateWalletDto.availableBalance;
      }
      await wallet.save();
      return {
        statusCode: HttpStatus.OK,
        message: 'Wallet updated successfully',
        data: wallet,
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = (error as Error)?.message || 'Error updating wallet';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async deposit(
    walletId: string,
    amount: number,
    paymentMethod: PaymentMethod,
    req: AuthenticatedRequest,
    userId?: string,
  ) {
    try {
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        throw new HttpException(
          'Deposit amount must be greater than 0',
          HttpStatus.BAD_REQUEST,
        );
      }

      const walletRes = await this.findOne(walletId);
      const wallet = walletRes.data as WalletsDocument;

      if (userId && wallet.userId?.toString() !== userId?.toString()) {
        throw new HttpException(
          'You do not have permission to operate on this wallet',
          HttpStatus.FORBIDDEN,
        );
      }

      const transaction = await this.transactionsModel.create({
        walletId: wallet._id,
        amount,
        transactionType: TransactionType.TOP_UP,
        direction: 'in',
        status: 'processing',
        referenceType: 'manual',
        balanceType: 'available',
        description: `${paymentMethod.toUpperCase()} Top-up #${Date.now()}`,
      });

      if (paymentMethod === PaymentMethod.MOMO) {
        const redirectHandler = `${process.env.API_BASE_URL || 'http://localhost:8000'}/momo/redirect`;
        const ipnHandler = `${process.env.API_BASE_URL || 'http://localhost:8000'}/momo/redirect`;

        const paymentResponse = await this.momoService.createPaymentUrl({
          amount,
          orderId: transaction._id.toString(),
          orderInfo: `WalletTopUp_${walletId}`,
          redirectUrl: redirectHandler,
          ipnUrl: ipnHandler,
        });

        const payUrl = (paymentResponse as Record<string, string>).payUrl;

        transaction.paymentUrl = payUrl;
        transaction.paymentMethod = 'momo';
        await transaction.save();

        return {
          transactionId: transaction._id,
          url: payUrl,
          paymentResponse,
        };
      } else if (paymentMethod === PaymentMethod.VNPAY) {
        const returnUrl = `${process.env.API_BASE_URL || 'http://localhost:8000'}/vnpay/return`;

        const paymentUrl = this.vnpayService.createPaymentUrl({
          vnp_Amount: amount,
          vnp_ReturnUrl: returnUrl,
          vnp_TxnRef: transaction._id.toString(),
          vnp_OrderInfo: `WalletTopUp_${walletId}`,
        });

        transaction.paymentUrl = paymentUrl;
        transaction.paymentMethod = 'vnpay';
        await transaction.save();

        return {
          transactionId: transaction._id,
          url: paymentUrl,
          paymentResponse: {
            payUrl: paymentUrl,
          },
        };
      } else {
        throw new HttpException(
          'Invalid payment method',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error)?.message || 'Error during deposit',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async withdraw(
    walletId: string,
    amount: number,
    userId?: string,
  ): Promise<APIResponseDto> {
    try {
      const wallet = await this.walletsModel.findOne({
        _id: walletId,
      });

      if (!wallet) {
        throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
      }

      if (userId && wallet.userId?.toString() !== userId?.toString()) {
        throw new HttpException(
          'You do not have permission to operate on this wallet',
          HttpStatus.FORBIDDEN,
        );
      }

      if (wallet.availableBalance < amount) {
        throw new HttpException(
          'Insufficient balance to withdraw',
          HttpStatus.BAD_REQUEST,
        );
      }

      wallet.availableBalance -= amount;
      await wallet.save();

      const transaction = await this.transactionsModel.create({
        walletId: wallet._id,
        amount,
        transactionType: TransactionType.WITHDRAWAL,
        direction: 'out',
        status: 'completed',
        referenceType: 'manual',
        balanceType: 'available',
        description: `Manual withdrawal #${Date.now()}`,
      });

      try {
        if (wallet.userId) {
          await this.notificationsService.create({
            receiverId: new Types.ObjectId(String(wallet.userId)),
            receiverType: wallet.type,
            title: 'Withdrawal Successful',
            message: `Your withdrawal of ${amount} VND has been processed.`,
            type: 'manual',
            referenceId: transaction._id,
            referenceType: 'wallet',
          });
        }
      } catch (err) {
        console.warn(
          'Failed to send withdrawal notification',
          (err as Error)?.message || err,
        );
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Withdrawal successful',
        data: {
          wallet,
          transactionId: transaction._id,
          transaction,
        },
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      const message = (error as Error)?.message || 'Error during withdrawal';
      throw new HttpException(message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async retryPayment(
    transactionId: string,
    userId?: string,
  ): Promise<{
    transactionId: string;
    url: string;
    paymentResponse: any;
  }> {
    try {
      const transaction = await this.transactionsModel.findById(transactionId);

      if (!transaction) {
        throw new HttpException('Transaction not found', HttpStatus.NOT_FOUND);
      }

      if (transaction.status !== 'processing') {
        throw new HttpException(
          `Cannot retry payment. Transaction status is: ${transaction.status}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const wallet = await this.walletsModel.findById(transaction.walletId);
      if (!wallet) {
        throw new HttpException('Wallet not found', HttpStatus.NOT_FOUND);
      }

      if (userId && wallet.userId?.toString() !== userId?.toString()) {
        throw new HttpException(
          'You do not have permission to access this transaction',
          HttpStatus.FORBIDDEN,
        );
      }

      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() - 60);

      const transactionDoc = transaction.toObject() as unknown as {
        createdAt: Date;
        updatedAt: Date;
      };
      if (transactionDoc.createdAt < expirationTime) {
        transaction.status = 'expired';
        await transaction.save();
        throw new HttpException(
          'Transaction has expired. Please create a new deposit request.',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (!transaction.paymentMethod) {
        throw new HttpException(
          'Payment method not found for this transaction',
          HttpStatus.BAD_REQUEST,
        );
      }

      const recentTime = new Date();
      recentTime.setMinutes(recentTime.getMinutes() - 30);
      const transactionDoc2 = transaction.toObject() as unknown as {
        createdAt: Date;
      };

      if (transaction.paymentUrl && transactionDoc2.createdAt > recentTime) {
        return {
          transactionId: transaction._id.toString(),
          url: transaction.paymentUrl,
          paymentResponse: {
            payUrl: transaction.paymentUrl,
          },
        };
      }

      if (transaction.paymentMethod === 'momo') {
        const redirectHandler = `${process.env.API_BASE_URL || 'http://localhost:8000'}/momo/redirect`;
        const ipnHandler = `${process.env.API_BASE_URL || 'http://localhost:8000'}/momo/redirect`;

        const paymentResponse = await this.momoService.createPaymentUrl({
          amount: transaction.amount,
          orderId: transaction._id.toString(),
          orderInfo: `WalletTopUp_${wallet._id.toString()}`,
          redirectUrl: redirectHandler,
          ipnUrl: ipnHandler,
        });

        const payUrl = (paymentResponse as Record<string, string>).payUrl;

        transaction.paymentUrl = payUrl;
        await transaction.save();

        return {
          transactionId: transaction._id.toString(),
          url: payUrl,
          paymentResponse,
        };
      } else if (transaction.paymentMethod === 'vnpay') {
        const returnUrl = `${process.env.API_BASE_URL || 'http://localhost:8000'}/vnpay/return`;

        const paymentUrl = this.vnpayService.createPaymentUrl({
          vnp_Amount: transaction.amount,
          vnp_ReturnUrl: returnUrl,
          vnp_TxnRef: transaction._id.toString(),
          vnp_OrderInfo: `WalletTopUp_${wallet._id.toString()}`,
        });

        transaction.paymentUrl = paymentUrl;
        await transaction.save();

        return {
          transactionId: transaction._id.toString(),
          url: paymentUrl,
          paymentResponse: {
            payUrl: paymentUrl,
          },
        };
      } else {
        throw new HttpException(
          'Invalid payment method for this transaction',
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        (error as Error)?.message || 'Error retrying payment',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Cron('*/15 * * * *') // every 15 minutes
  async expireOldTransactions() {
    try {
      console.log('[Cron] Starting expired transactions cleanup...');

      const expirationTime = new Date();
      expirationTime.setMinutes(expirationTime.getMinutes() - 60);

      const result = await this.transactionsModel.updateMany(
        {
          status: 'processing',
          transactionType: TransactionType.TOP_UP,
          createdAt: { $lt: expirationTime },
        },
        {
          $set: {
            status: 'expired',
            updatedAt: new Date(),
          },
        },
      );

      if (result.modifiedCount > 0) {
        console.log(
          `[Cron] Expired ${result.modifiedCount} old processing transactions`,
        );
      } else {
        console.log('[Cron] No expired transactions found');
      }

      return {
        success: true,
        expiredCount: result.modifiedCount,
      };
    } catch (error) {
      console.error(
        '[Cron] Error expiring old transactions:',
        (error as Error)?.message || error,
      );
      throw error;
    }
  }
}
