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

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallets.name) private walletsModel: Model<Wallets>,
    @InjectModel(WalletTransactions.name)
    private transactionsModel: Model<WalletTransactions>,
    private readonly vnpayService: VnpayService,
  ) {}

  async create(createWalletDto: CreateWalletDto): Promise<APIResponseDto> {
    try {
      const { userId } = createWalletDto;
      const existingWallet = await this.walletsModel.findOne({
        userId: userId,
      });
      if (existingWallet) {
        return {
          statusCode: 400,
          message: 'Wallet already exists for this user',
        };
      }
      const wallet = new this.walletsModel({
        userId: new Types.ObjectId(createWalletDto.userId),
        balance: 0,
      });
      await wallet.save();
      return {
        statusCode: 201,
        message: 'Wallet created successfully',
        data: wallet,
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Error creating wallet',
        data: error.message,
      };
    }
  }

  async findOne(id: string): Promise<APIResponseDto> {
    try {
      const wallet = await this.walletsModel.findById(id);
      if (!wallet) {
        return {
          statusCode: 404,
          message: 'Wallet not found',
        };
      }
      return {
        statusCode: 200,
        message: 'Wallet retrieved successfully',
        data: wallet,
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Error retrieving wallet',
        data: error.message,
      };
    }
  }

  async update(
    id: string,
    updateWalletDto: UpdateWalletDto,
  ): Promise<APIResponseDto> {
    try {
      const wallet = await this.walletsModel.findById(id);
      if (!wallet) {
        return {
          statusCode: 404,
          message: 'Wallet not found',
        };
      }
      if (updateWalletDto.balance !== undefined) {
        wallet.balance = updateWalletDto.balance;
      }
      await wallet.save();
      return {
        statusCode: 200,
        message: 'Wallet updated successfully',
        data: wallet,
      };
    } catch (error) {
      return {
        statusCode: 500,
        message: 'Error updating wallet',
        data: error.message,
      };
    }
  }

  // Add fund to wallet
  async deposit(
    walletId: string,
    amount: number,
    req: Request,
    userId?: string,
  ) {
    try {
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        return {
          statusCode: 400,
          message: 'Deposit amount must be greater than 0',
        };
      }

      const walletRes = await this.findOne(walletId);
      if (walletRes.statusCode !== 200 || !walletRes.data) {
        return walletRes;
      }

      const wallet = walletRes.data as WalletsDocument;
      if (userId && wallet.userId?.toString() !== userId?.toString()) {
        return {
          statusCode: 403,
          message: 'You do not have permission to operate on this wallet',
        };
      }
      // const transactionId = `${walletId}-${Date.now()}-${randomBytes(3).toString('hex')}`;
      const orderInfo = `Payment_${walletId}`;

      let ipAddr =
        (req.headers['x-forwarded-for'] as string) ||
        req.socket?.remoteAddress ||
        (req.connection && req.connection.remoteAddress) ||
        '';

      if (Array.isArray(ipAddr)) {
        ipAddr = ipAddr[0];
      }

      if (ipAddr.includes(',')) {
        ipAddr = ipAddr.split(',')[0].trim();
      }
      if (
        ipAddr === '::1' ||
        ipAddr === '::ffff:127.0.0.1' ||
        ipAddr.startsWith('::ffff:')
      ) {
        ipAddr = '127.0.0.1';
      }

      if (ipAddr.startsWith('::ffff:')) {
        ipAddr = ipAddr.substring(7);
      }

      if (!ipAddr || ipAddr === '::1') {
        ipAddr = '127.0.0.1';
      }
      // determine performing user id (from param or authenticated request)
      const performingUserId = userId ?? (req as any)?.user?._id ?? null;
      if (!performingUserId) {
        return {
          statusCode: 401,
          message: 'Unauthorized: user id not provided',
        };
      }

      const transaction = await this.transactionsModel.create({
        walletId: wallet._id,
        userId: new Types.ObjectId(performingUserId as string),
        amount,
        transactionType: 'deposit',
        direction: 'in',
        status: 'processing',
        referenceType: 'manual',
        description: `VNPay Top-up #${Date.now()}`,
      });

      const paymentUrl = this.vnpayService.createPaymentUrl(
        transaction._id.toString(),
        amount,
        ipAddr,
        orderInfo,
      );
      return {
        url: paymentUrl,
      };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Error during deposit',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // Withdraw money
  async withdraw(walletId: string, amount: number, userId?: string) {
    try {
      const walletRes = await this.findOne(walletId);
      if (walletRes.statusCode !== 200 || !walletRes.data) {
        return walletRes;
      }
      const wallet = walletRes.data as WalletsDocument;
      if (userId && wallet.userId?.toString() !== userId?.toString()) {
        return {
          statusCode: 403,
          message: 'You do not have permission to operate on this wallet',
        };
      }
      if (wallet.balance < amount) {
        return {
          statusCode: 400,
          message: 'Insufficient balance to withdraw',
        };
      }

      wallet.balance -= amount;
      await wallet.save();

      const transaction = await this.transactionsModel.create({
        walletId: wallet._id,
        userId: new Types.ObjectId(userId),
        amount,
        transactionType: 'withdraw',
        direction: 'out',
        status: 'completed',
        referenceType: 'manual',
        description: `Manual withdrawal #${Date.now()}`,
      });

      console.log('Created Withdraw:', transaction);

      return {
        statusCode: 200,
        message: 'Withdrawal successful',
        data: wallet,
      };
    } catch (error) {
      throw new HttpException(
        error?.message || 'Error during withdrawal',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
