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

  // Add fund to wallet
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
        throw new HttpException(
          'Unauthorized: user id not provided',
          HttpStatus.UNAUTHORIZED,
        );
      }

      const transaction = await this.transactionsModel.create({
        walletId: wallet._id,
        relatedUserId: new Types.ObjectId(performingUserId as string),
        relatedUserType: wallet.type,
        amount,
        transactionType: 'topup',
        direction: 'in',
        status: 'pending',
        referenceType: 'vnpay',
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

      await this.transactionsModel.create({
        walletId: wallet._id,
        relatedUserId: new Types.ObjectId(userId),
        relatedUserType: wallet.type,
        amount,
        transactionType: 'withdrawal',
        direction: 'out',
        status: 'completed',
        referenceType: 'manual',
        description: `Manual withdrawal #${Date.now()}`,
      });

      return {
        statusCode: HttpStatus.OK,
        message: 'Withdrawal successful',
        data: wallet,
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
