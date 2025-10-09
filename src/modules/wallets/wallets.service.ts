import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallets, WalletsDocument } from './schemas/wallets.schema';
import { VnpayService } from '../../infrastructure/vnpay/vnpay.service';
import { Request } from 'express';
import { randomBytes } from 'crypto';
import { Transactions } from './schemas/transations.shema';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallets.name) private walletsModel: Model<Wallets>,
    @InjectModel(Transactions.name)
    private transactionsModel: Model<Transactions>,
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
        userId: createWalletDto.userId,
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

  async deposit(
    walletId: string,
    amount: number,
    req: Request,
    userId?: string,
  ) {
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
    if (ipAddr.startsWith('::ffff:') || ipAddr.startsWith('::1')) {
      ipAddr = '127.0.0.1';
    }

    const transaction = await this.transactionsModel.create({
      walletId: walletId,
      amount: amount,
      type: 'deposit',
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
  }

  async withdraw(walletId: string, amount: number, userId?: string) {
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
    return {
      statusCode: 200,
      message: 'Withdrawal successful',
      data: wallet,
    };
  }
}
