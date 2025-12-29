import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  RewardPointsPackage,
  RewardPointsPackageSchema,
} from './schemas/reward-points-package.schema';
import {
  RewardPointsPurchaseHistory,
  RewardPointsPurchaseHistorySchema,
} from './schemas/reward-points-purchase-history.schema';
import { RewardPointsPackagesService } from './services/reward-points-packages.service';
import { RewardPointsPackagesController } from './controllers/reward-points-packages.controller';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import { Wallets, WalletsSchema } from '../wallets/schemas/wallets.schema';
import {
  WalletTransactions,
  WalletTransactionsSchema,
} from '../wallet-transactions/schema/wallet-transactions.schema';
import { Users, UsersSchema } from '../users/schemas/users.schema';
import { MailerModule } from 'src/infrastructure/mailer/mailer.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RewardPointsPackage.name, schema: RewardPointsPackageSchema },
      {
        name: RewardPointsPurchaseHistory.name,
        schema: RewardPointsPurchaseHistorySchema,
      },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: Wallets.name, schema: WalletsSchema },
      { name: WalletTransactions.name, schema: WalletTransactionsSchema },
      { name: Users.name, schema: UsersSchema },
    ]),
    MailerModule,
  ],
  controllers: [RewardPointsPackagesController],
  providers: [RewardPointsPackagesService],
  exports: [RewardPointsPackagesService],
})
export class RewardPointsPackagesModule {}
