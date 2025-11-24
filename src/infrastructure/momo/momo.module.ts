import { Module } from '@nestjs/common';
import { MomoService } from './momo.service';
import { MomoController } from './momo.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Wallets,
  WalletsSchema,
} from 'src/modules/wallets/schemas/wallets.schema';
import {
  WalletTransactions,
  WalletTransactionsSchema,
} from 'src/modules/wallet-transactions/schema/wallet-transactions.schema';
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
  controllers: [MomoController],
  providers: [MomoService],
  exports: [MomoService],
})
export class MomoModule {}
