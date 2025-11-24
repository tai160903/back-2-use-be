import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallets, WalletsDocument } from './schemas/wallets.schema';
import { VnpayService } from '../../infrastructure/vnpay/vnpay.service';
import { Request } from 'express';
import { WalletTransactions } from '../wallet-transactions/schema/wallet-transactions.schema';
import { TransactionType } from 'src/common/constants/transaction-type.enum';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallets.name) private walletsModel: Model<Wallets>,
    @InjectModel(WalletTransactions.name)
    private transactionsModel: Model<WalletTransactions>,
    private readonly notificationsService: NotificationsService,
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
    req: Request,
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
        description: `VNPay Top-up #${Date.now()}`,
      });

      const orderInfo = `Payment_${walletId}`;
      const returnUrl = process.env.VNP_RETURN_URL || '';
      const paymentUrl = this.vnpayService.createPaymentUrl({
        vnp_TxnRef: transaction._id.toString(),
        vnp_Amount: amount,
        vnp_OrderInfo: orderInfo,
        vnp_ReturnUrl: returnUrl,
      });

      return { url: paymentUrl };
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

  // Withdraw money
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
}
