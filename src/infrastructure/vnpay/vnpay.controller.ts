import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { VnpayService } from './vnpay.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Wallets } from '../../modules/wallets/schemas/wallets.schema';
import { WalletTransactions } from 'src/modules/wallet-transactions/schema/wallet-transactions.schema';

@ApiExcludeController()
@Controller('vnpay')
export class VnpayController {
  constructor(
    private readonly vnpayService: VnpayService,
    @InjectModel(WalletTransactions.name)
    private transactionsModel: Model<WalletTransactions>,
    @InjectModel(Wallets.name) private walletsModel: Model<Wallets>,
  ) {}

  @Get('return')
  async vnpayReturn(@Query() query: any, @Res() res: Response) {
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
    if (responseCode === '00') {
      transaction.status = 'completed';
      await transaction.save();
      const wallet = await this.walletsModel.findById(transaction.walletId);
      if (wallet) {
        wallet.balance += transaction.amount;
        await wallet.save();
      }
      return res.redirect(`${process.env.CLIENT_RETURN_URL}/payment-success`);
    } else {
      transaction.status = 'failed';
      await transaction.save();
      return res.redirect(
        `${process.env.CLIENT_RETURN_URL}/payment-failed?code=${responseCode}`,
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

    if (vnp_ResponseCode === '00' && vnp_TransactionStatus === '00') {
      const walletId = vnp_OrderInfo.replace('Payment_', '');
      const amount = parseInt(vnp_Amount) / 100;

      const transaction = await this.transactionsModel.findById(vnp_TxnRef);
      if (transaction) {
        transaction.status = 'completed';
        await transaction.save();
      }

      const wallet = await this.walletsModel.findById(walletId);
      if (wallet) {
        wallet.balance += amount;
        await wallet.save();
      }

      return res.redirect('http://192.168.0.199:8081/payment-success');
    } else {
      const transaction = await this.transactionsModel.findById(vnp_TxnRef);
      if (transaction) {
        transaction.status = 'failed';
        await transaction.save();
      }

      return res.redirect('http://192.168.0.199:8081/payment-failed');
    }
  }
}
