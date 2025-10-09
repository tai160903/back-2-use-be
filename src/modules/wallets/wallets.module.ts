import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';
import { WalletsController } from './wallets.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Wallets, WalletsSchema } from './schemas/wallets.schema';
import { VnpayModule } from '../../infrastructure/vnpay/vnpay.module';
import { Transactions, TransactionsSchema } from './schemas/transations.shema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallets.name, schema: WalletsSchema },
      { name: Transactions.name, schema: TransactionsSchema },
    ]),
    VnpayModule,
  ],
  controllers: [WalletsController],
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
