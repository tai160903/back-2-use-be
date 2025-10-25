import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Businesses, BusinessesSchema } from './schemas/businesses.schema';
import { CloudinaryModule } from 'src/infrastructure/cloudinary/cloudinary.module';
import {
  BusinessForm,
  BusinessFormSchema,
} from './schemas/business-form.schema';
import {
  Subscriptions,
  SubscriptionsSchema,
} from '../subscriptions/schemas/subscriptions.schema';
import {
  BusinessSubscriptions,
  BusinessSubscriptionsSchema,
} from './schemas/business-subscriptions.schema';
import { Wallets, WalletsSchema } from '../wallets/schemas/wallets.schema';
import { Users, UsersSchema } from '../users/schemas/users.schema';
import { NotificationsModule } from '../notifications/notifications.module';
import {
  NotificationsSchema,
  Notification,
} from '../notifications/schemas/notifications.schema';
import {
  WalletTransactions,
  WalletTransactionsSchema,
} from '../wallet-transactions/schema/wallet-transactions.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Businesses.name,
        schema: BusinessesSchema,
      },
      { name: BusinessForm.name, schema: BusinessFormSchema },
      { name: Subscriptions.name, schema: SubscriptionsSchema },
      { name: BusinessSubscriptions.name, schema: BusinessSubscriptionsSchema },
      { name: Wallets.name, schema: WalletsSchema },
      { name: Users.name, schema: UsersSchema },
      { name: Notification.name, schema: NotificationsSchema },
      { name: WalletTransactions.name, schema: WalletTransactionsSchema },
    ]),
    CloudinaryModule,
    NotificationsModule,
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
