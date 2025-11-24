import { Module } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { VnpayController } from './vnpay.controller';
import {
  WalletTransactions,
  WalletTransactionsSchema,
} from 'src/modules/wallet-transactions/schema/wallet-transactions.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Wallets,
  WalletsSchema,
} from 'src/modules/wallets/schemas/wallets.schema';
import { NotificationsModule } from 'src/modules/notifications/notifications.module';
import {
  Notification,
  NotificationsSchema,
} from 'src/modules/notifications/schemas/notifications.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Wallets.name, schema: WalletsSchema },
      { name: WalletTransactions.name, schema: WalletTransactionsSchema },
      { name: Notification.name, schema: NotificationsSchema },
    ]),
    NotificationsModule,
  ],

  providers: [VnpayService],
  controllers: [VnpayController],
  exports: [VnpayService],
})
export class VnpayModule {}
