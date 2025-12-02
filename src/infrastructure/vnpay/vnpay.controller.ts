import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { VnpayService } from './vnpay.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallets } from '../../modules/wallets/schemas/wallets.schema';
import { WalletTransactions } from 'src/modules/wallet-transactions/schema/wallet-transactions.schema';
import { NotificationsService } from 'src/modules/notifications/notifications.service';

@ApiExcludeController()
@Controller('vnpay')
export class VnpayController {
  constructor(
    private readonly vnpayService: VnpayService,
    @InjectModel(WalletTransactions.name)
    private transactionsModel: Model<WalletTransactions>,
    @InjectModel(Wallets.name) private walletsModel: Model<Wallets>,
    private readonly notificationsService: NotificationsService,
  ) {}
  @Get('return')
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
    try {
      const platform = query['platform'] || 'web';

      if (!this.vnpayService.verifyVnpayReturn(query)) {
        if (platform === 'mobile') {
          return res.redirect(
            `com.back2use://payment-result?success=false&amount=0&orderId=&reason=invalid-signature`,
          );
        }
        return res.redirect(
          `${process.env.CLIENT_RETURN_URL}/payment-failed?reason=invalid-signature`,
        );
      }

      const transactionId = query['vnp_TxnRef'];
      const responseCode = query['vnp_ResponseCode'];
      const amount = query['vnp_Amount']
        ? parseInt(query['vnp_Amount'], 10) / 100
        : 0;

      const transaction = await this.transactionsModel.findById(transactionId);
      if (!transaction) {
        return res.status(404).json({ message: 'Transaction not found' });
      }

      if (transaction.status === 'completed') {
        if (platform === 'mobile') {
          return res.redirect(
            `com.back2use://payment-result?success=true&amount=${transaction.amount}&orderId=${transaction._id}`,
          );
        }
        return res.redirect(
          `${process.env.CLIENT_RETURN_URL}/payment-success?status=already-done`,
        );
      }

      const wallet = await this.walletsModel.findById(transaction.walletId);

      if (responseCode === '00') {
        transaction.status = 'completed';
        await transaction.save();

        if (wallet) {
          wallet.availableBalance += transaction.amount;
          await wallet.save();
        }

        if (wallet?.userId) {
          await this.notificationsService.create({
            receiverId: wallet.userId,
            receiverType: wallet.type,
            title: 'Wallet Top-up Successful',
            message: `Your wallet has been topped up with ${transaction.amount} VND.`,
            type: 'manual',
            referenceId: transaction._id,
            referenceType: 'wallet',
          });
        }

        if (platform === 'mobile') {
          return res.redirect(
            `com.back2use://payment-result?success=true&amount=${transaction.amount}&orderId=${transaction._id}`,
          );
        }
        return res.redirect(
          `${process.env.CLIENT_RETURN_URL}/payment-success?txnRef=${transaction._id}`,
        );
      }

      transaction.status = 'failed';
      await transaction.save();

      // No realtime notification required per updated requirement.

      if (platform === 'mobile') {
        return res.redirect(
          `com.back2use://payment-result?success=false&amount=${amount}&orderId=${transactionId}&code=${responseCode}`,
        );
      }
      return res.redirect(
        `${process.env.CLIENT_RETURN_URL}/payment-failed?code=${responseCode}`,
      );
    } catch (error) {
      console.error('vnpayReturn error', error);
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
          wallet.availableBalance += amount;
          await wallet.save();

          await this.notificationsService.create({
            receiverId: wallet.userId,
            receiverType: wallet.type,
            title: 'Wallet Top-up Successful',
            message: `Your wallet has been topped up with ${amount} VND.`,
            type: 'manual',
            referenceId: transaction?._id,
            referenceType: 'wallet',
          });
        }

        return res.redirect(
          `http://192.168.0.199:8081/payment-success/?txnRef=${transaction?._id}`,
        );
      }

      const transaction = await this.transactionsModel.findById(vnp_TxnRef);
      if (transaction) {
        transaction.status = 'failed';
        await transaction.save();
      }

      return res.redirect('http://192.168.0.199:8081/payment-failed');
    } catch (error) {
      return res.redirect('http://192.168.0.199:8081/payment-failed');
    }
  }

  // Realtime notification removed as per requirement.
}
