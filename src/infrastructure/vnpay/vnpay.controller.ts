import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Response } from 'express';
import { VnpayService } from './vnpay.service';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Transactions } from '../../modules/wallets/schemas/transations.shema';
import { Wallets } from '../../modules/wallets/schemas/wallets.schema';

@ApiExcludeController()
@Controller('vnpay')
export class VnpayController {
  constructor(
    private readonly vnpayService: VnpayService,
    @InjectModel(Transactions.name)
    private transactionsModel: Model<Transactions>,
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
    console.log('VNPay Transaction:', transaction);
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
}
