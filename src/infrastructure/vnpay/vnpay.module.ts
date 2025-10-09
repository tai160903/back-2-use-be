import { Module } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { VnpayController } from './vnpay.controller';
import {
  Transactions,
  TransactionsSchema,
} from 'src/modules/wallets/schemas/transations.shema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Wallets,
  WalletsSchema,
} from 'src/modules/wallets/schemas/wallets.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallets.name, schema: WalletsSchema },
      { name: Transactions.name, schema: TransactionsSchema },
    ]),
  ],
  providers: [VnpayService],
  controllers: [VnpayController],
  exports: [VnpayService],
})
export class VnpayModule {}
