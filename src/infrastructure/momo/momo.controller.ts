import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { MomoService } from './momo.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wallets } from 'src/modules/wallets/schemas/wallets.schema';
import { WalletTransactions } from 'src/modules/wallet-transactions/schema/wallet-transactions.schema';
import { NotificationsService } from 'src/modules/notifications/notifications.service';
import { CreateMomoPaymentDto } from './dto/create-momo-payment.dto';
import { TransactionType } from 'src/common/constants/transaction-type.enum';
import { ApiExcludeController } from '@nestjs/swagger';

@ApiExcludeController()
@Controller('momo')
export class MomoController {
  constructor(
    private readonly momoService: MomoService,
    @InjectModel(WalletTransactions.name)
    private transactionsModel: Model<WalletTransactions>,
    @InjectModel(Wallets.name) private walletsModel: Model<Wallets>,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Post('create-payment-url')
  async createPaymentUrl(@Body() body: CreateMomoPaymentDto) {
    const { walletId, amount } = body;
    const wallet = await this.walletsModel.findById(walletId);
    if (!wallet) {
      throw new BadRequestException('Wallet not found');
    }

    const transaction = await this.transactionsModel.create({
      walletId: new Types.ObjectId(walletId),
      amount,
      transactionType: TransactionType.TOP_UP,
      direction: 'in',
      referenceType: 'wallet',
      description: 'MoMo wallet top-up',
      status: 'processing',
    });

    const redirectHandler = `${process.env.API_BASE_URL}/momo/redirect`;
    const ipnHandler = `${process.env.API_BASE_URL}/momo/redirect`; // reuse for now

    const paymentResponse = await this.momoService.createPaymentUrl({
      amount,
      orderId: transaction._id.toString(),
      orderInfo: `WalletTopUp_${walletId}`,
      redirectUrl: redirectHandler,
      ipnUrl: ipnHandler,
    });

    return {
      transactionId: transaction._id,
      paymentResponse,
    };
  }

  @Get('redirect')
  async redirect(@Query() query: Record<string, string>, @Res() res: Response) {
    try {
      const verify = this.momoService.verifyMomoReturn(query);
      console.log(verify);
      const orderId = query.orderId;
      const amountStr = query.amount;
      const amount = parseInt(amountStr || '0', 10);

      const transaction = await this.transactionsModel.findById(orderId);
      if (!transaction) {
        return res.redirect(
          `${process.env.CLIENT_RETURN_URL}/payment-failed?reason=transaction-not-found`,
        );
      }

      console.log('Transaction status:', transaction.status);

      if (transaction.status === 'completed') {
        return res.redirect(
          `${process.env.CLIENT_RETURN_URL}/payment-success?status=already-done`,
        );
      }

      const wallet = await this.walletsModel.findById(transaction.walletId);

      if (verify.isSuccess === true) {
        transaction.status = 'completed';
        await transaction.save();
        if (wallet) {
          wallet.availableBalance += amount;
          await wallet.save();
          if (wallet.userId) {
            await this.notificationsService.create({
              receiverId: wallet.userId,
              receiverType: wallet.type,
              title: 'Wallet Top-up Successful',
              message: `Your wallet has been topped up with ${amount} VND via MoMo.`,
              type: 'manual',
              referenceId: transaction._id,
              referenceType: 'wallet',
            });
          }
        }
        console.log(transaction);
        console.log(wallet);
        return res.redirect(
          `${process.env.CLIENT_RETURN_URL}/payment-success?txnRef=${transaction._id}`,
        );
      }

      transaction.status = 'failed';
      await transaction.save();
      return res.redirect(
        `${process.env.CLIENT_RETURN_URL}/payment-failed?reason=${encodeURIComponent(verify.message)}`,
      );
    } catch (error) {
      return res.redirect(
        `${process.env.CLIENT_RETURN_URL}/payment-failed?reason=server-error`,
      );
    }
  }

  @Get('payment-return')
  async paymentReturn(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const verify = this.momoService.verifyMomoReturn(query);
      const orderId = query.orderId;
      const amountStr = query.amount;
      const amount = parseInt(amountStr || '0', 10);

      const transaction = await this.transactionsModel.findById(orderId);
      if (!transaction) {
        return res.redirect('http://192.168.0.199:8081/payment-failed');
      }

      if (transaction.status === 'completed') {
        return res.redirect(
          `http://192.168.0.199:8081/payment-success/?txnRef=${transaction._id.toString()}`,
        );
      }

      const wallet = await this.walletsModel.findById(transaction.walletId);

      if (verify.isSuccess) {
        transaction.status = 'completed';
        await transaction.save();

        if (wallet) {
          wallet.availableBalance += amount;
          await wallet.save();

          if (wallet.userId) {
            await this.notificationsService.create({
              receiverId: wallet.userId,
              receiverType: wallet.type,
              title: 'Wallet Top-up Successful',
              message: `Your wallet has been topped up with ${amount} VND via MoMo.`,
              type: 'manual',
              referenceId: transaction._id,
              referenceType: 'wallet',
            });
          }
        }

        return res.redirect(
          `http://192.168.0.199:8081/payment-success/?txnRef=${transaction._id.toString()}`,
        );
      }

      transaction.status = 'failed';
      await transaction.save();

      return res.redirect('http://192.168.0.199:8081/payment-failed');
    } catch {
      return res.redirect('http://192.168.0.199:8081/payment-failed');
    }
  }
}
