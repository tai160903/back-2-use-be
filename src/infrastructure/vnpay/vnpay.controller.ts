import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { VnpayService } from './vnpay.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallets } from '../../modules/wallets/schemas/wallets.schema';
import { WalletTransactions } from 'src/modules/wallet-transactions/schema/wallet-transactions.schema';
import { NotificationsGateway } from 'src/modules/notifications/notifications.gateway';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

@ApiExcludeController()
@Controller('vnpay')
export class VnpayController {
  constructor(
    private readonly vnpayService: VnpayService,
    @InjectModel(WalletTransactions.name)
    private transactionsModel: Model<WalletTransactions>,
    @InjectModel(Wallets.name) private walletsModel: Model<Wallets>,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly notificationsService: NotificationsService,
  ) {}

  @Get('return')
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
    try {
      const isValid = this.vnpayService.verifyVnpayReturn(query);
      if (!isValid) {
        return res.redirect(
          `${process.env.CLIENT_RETURN_URL}/payment-failed?reason=invalid-signature`,
        );
      }

      const transactionId = query['vnp_TxnRef'];
      const responseCode = query['vnp_ResponseCode'];
      const transaction = await this.transactionsModel.findById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      if (transaction.status === 'completed') {
        return res.redirect(
          `${process.env.CLIENT_RETURN_URL}/payment-success?status=already-done`,
        );
      }

      const wallet = await this.walletsModel.findById(transaction.walletId);

      if (responseCode === '00') {
        transaction.status = 'completed';
        await transaction.save();

        if (wallet) {
          wallet.balance += transaction.amount;
          await wallet.save();
        }

        if (wallet && wallet.userId) {
          await this.notificationsService.create({
            userId: wallet.userId.toString(),
            title: 'Wallet Top-up Successful',
            message: `Your wallet has been topped up with ${transaction.amount} VND.`,
            type: 'wallet',
          });

          this.sendRealtimeNotification(
            wallet.userId.toString(),
            `Your wallet has been topped up with ${transaction.amount} VND.`,
          );
        }

        return res.redirect(`${process.env.CLIENT_RETURN_URL}/payment-success`);
      }

      transaction.status = 'failed';
      await transaction.save();

      if (wallet && wallet.userId) {
        this.sendRealtimeNotification(
          wallet.userId.toString(),
          `Your wallet top-up of ${transaction.amount} VND has failed.`,
        );
      }

      return res.redirect(
        `${process.env.CLIENT_RETURN_URL}/payment-failed?code=${responseCode}`,
      );
    } catch (err) {
      console.error('vnpayReturn error', err?.message || err);
      return res.redirect(
        `${process.env.CLIENT_RETURN_URL}/payment-failed?reason=server-error`,
      );
    }
  }

  @Get('payment-return')
  async vnpayPaymentReturn(@Query() query: any, @Res() res: Response) {
    const {
      vnp_ResponseCode,
      vnp_TransactionStatus,
      vnp_Amount,
      vnp_OrderInfo,
      vnp_TxnRef,
    } = query;

    try {
      if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
        const walletId = vnp_OrderInfo.replace('Payment_', '');
        const amount = parseInt(vnp_Amount, 10) / 100;

        const transaction = await this.transactionsModel.findById(vnp_TxnRef);
        if (transaction) {
          transaction.status = 'completed';
          await transaction.save();
        }

        const wallet = await this.walletsModel.findById(walletId);
        if (wallet) {
          wallet.balance += amount;
          await wallet.save();

          // persist notification
          await this.notificationsService.create({
            userId: wallet.userId.toString(),
            title: 'Wallet Top-up Successful',
            message: `Your wallet has been topped up with ${amount} VND.`,
            type: 'wallet',
          });

          this.sendRealtimeNotification(
            wallet.userId.toString(),
            `Your wallet has been topped up with ${amount} VND.`,
          );
        }

        return res.redirect('http://192.168.0.199:8081/payment-success');
      }

      const transaction = await this.transactionsModel.findById(vnp_TxnRef);
      if (transaction) {
        transaction.status = 'failed';
        await transaction.save();
      }

      return res.redirect('http://192.168.0.199:8081/payment-failed');
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('vnpayPaymentReturn error', err?.message || err);
      return res.redirect('http://192.168.0.199:8081/payment-failed');
    }
  }

  private sendRealtimeNotification(userId: string, message: string) {
    try {
      const gatewayAny = this.notificationsGateway as any;
      if (gatewayAny && typeof gatewayAny.sendNotification === 'function') {
        gatewayAny.sendNotification(userId, message);
      }
    } catch (err) {
      // don't let realtime send block main flow
      // eslint-disable-next-line no-console
      console.warn('sendRealtimeNotification failed', err?.message || err);
    }
  }
}
