import { Module } from '@nestjs/common';
import { WalletTransactionsController } from './wallet-transactions.controller';
import { WalletTransactionsService } from './wallet-transactions.service';
import {
  WalletTransactions,
  WalletTransactionsSchema,
} from './schema/wallet-transactions.schema';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WalletTransactions.name, schema: WalletTransactionsSchema },
    ]),
  ],
  controllers: [WalletTransactionsController],
  providers: [WalletTransactionsService],
})
export class WalletTransactionsModule {}
