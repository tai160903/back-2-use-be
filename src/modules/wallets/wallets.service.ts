import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallets } from './schemas/wallets.schema';
import { VnpayService } from '../vnpay/vnpay.service';
import { Request } from 'express';
import { randomBytes } from 'crypto';

@Injectable()
export class WalletsService {
  constructor(
    @InjectModel(Wallets.name) private walletsModel: Model<Wallets>,
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

  async deposit(walletId: string, amount: number, req: Request) {
    const walletRes = await this.findOne(walletId);
    if (walletRes.statusCode !== 200) {
      return walletRes;
    }
    // Sinh mã giao dịch duy nhất cho mỗi lần nạp
    const transactionId = `${walletId}-${Date.now()}-${randomBytes(3).toString('hex')}`;
    const orderInfo = `Deposit money into wallet ${walletId}`;
    let ipAddr =
      req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '';
    if (Array.isArray(ipAddr)) {
      ipAddr = ipAddr[0];
    }
    const paymentUrl = this.vnpayService.createPaymentUrl(
      transactionId,
      amount,
      ipAddr,
      orderInfo,
    );
    return { url: paymentUrl, transactionId };
  }

  async withdraw(walletId: string, amount: number) {
    const walletRes = await this.findOne(walletId);
    if (walletRes.statusCode !== 200) {
      return walletRes;
    }
    const wallet = walletRes.data;
    if (wallet.balance < amount) {
      return { statusCode: 400, message: 'Số dư không đủ để rút' };
    }
    wallet.balance -= amount;
    await wallet.save();
    return { statusCode: 200, message: 'Rút tiền thành công', data: wallet };
  }
}
