import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminMaterialController } from './controllers/admin-material.controller';
import { AdminMaterialService } from './services/admin-material.service';
import {
  BusinessForm,
  BusinessFormSchema,
} from '../businesses/schemas/business-form.schema';
import { Material, MaterialSchema } from '../materials/schemas/material.schema';
import { BusinessesModule } from '../businesses/businesses.module';

import { Users, UsersSchema } from '../users/schemas/users.schema';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import { AdminCustomerController } from './controllers/admin-customer.controller';
import { AdminCustomerService } from './services/admin-customer.service';
import { AdminBusinessController } from './controllers/admin-business.controller';
import { AdminBusinessService } from './services/admin-business.service';
import { MailerModule } from 'src/infrastructure/mailer/mailer.module';
import { AdminBusinessFormController } from './controllers/admin-business-form.controller';
import { AdminBusinessFormService } from './services/admin-business-form.service';
import {
  UserBlockHistory,
  UserBlockHistorySchema,
} from '../users/schemas/users-block-history';
import { Customers, CustomersSchema } from '../users/schemas/customer.schema';

import {
  BusinessSubscriptions,
  BusinessSubscriptionsSchema,
} from '../businesses/schemas/business-subscriptions.schema';
import { Wallets, WalletsSchema } from '../wallets/schemas/wallets.schema';
import { GeocodingModule } from 'src/infrastructure/geocoding/geocoding.module';
import { Vouchers, VouchersSchema } from '../vouchers/schema/vouchers.schema';
import { AdminVoucherController } from './controllers/admin-voucher.controller';
import { AdminVoucherService } from './services/admin-voucher.service';
import {
  VoucherCodes,
  VoucherCodesSchema,
} from '../voucher-codes/schema/voucher-codes.schema';
import {
  MaterialRequests,
  MaterialRequestSchema,
} from '../materials/schemas/material-requests.schema';
import {
  WalletTransactions,
  WalletTransactionsSchema,
} from '../wallet-transactions/schema/wallet-transactions.schema';
import {
  EcoRewardPolicy,
  EcoRewardPolicySchema,
} from '../eco-reward-policies/schemas/eco-reward-policy.schema';
import { AdminEcoRewardPoliciesController } from './controllers/admin-eco-policy.controller';
import { AdminEcoRewardPoliciesService } from './services/admin-eco-policy.service';
import {
  BusinessVouchers,
  BusinessVouchersSchema,
} from '../businesses/schemas/business-voucher.schema';
import { AdminLeaderboardPolicyController } from './controllers/admin-leaderboard-policy.controller';
import { AdminLeaderboardPolicyService } from './services/admin-leaderboard-policy.service';
import {
  LeaderboardRewardPolicy,
  LeaderboardRewardPolicySchema,
} from '../leaderboard-reward-policies/schema/leaderboard-reward-policies.schema';
import { AdminLeaderboardRewardController } from './controllers/admin-leaderboard-reward.controller';
import { AdminLeaderboardRewardService } from './services/admin-leaderboard-reward.service';
import {
  LeaderboardReward,
  LeaderboardRewardSchema,
} from '../leaderboard-reward/schema/leaderboard-rewards.schema';
import {
  SystemSetting,
  SystemSettingSchema,
} from '../system-settings/schemas/system-setting.schema';
import { AdminSystemSettingController } from './controllers/admin-system-setting.controller';
import { AdminSystemSettingService } from './services/admin-system-setting.service';
import {
  Subscriptions,
  SubscriptionsSchema,
} from '../subscriptions/schemas/subscriptions.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessForm.name, schema: BusinessFormSchema },
      { name: Customers.name, schema: CustomersSchema },
      { name: Material.name, schema: MaterialSchema },
      { name: MaterialRequests.name, schema: MaterialRequestSchema },
      { name: Users.name, schema: UsersSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: UserBlockHistory.name, schema: UserBlockHistorySchema },
      { name: Subscriptions.name, schema: SubscriptionsSchema },
      { name: BusinessSubscriptions.name, schema: BusinessSubscriptionsSchema },
      { name: Wallets.name, schema: WalletsSchema },
      { name: WalletTransactions.name, schema: WalletTransactionsSchema },
      { name: Vouchers.name, schema: VouchersSchema },
      { name: VoucherCodes.name, schema: VoucherCodesSchema },
      { name: BusinessVouchers.name, schema: BusinessVouchersSchema },
      { name: EcoRewardPolicy.name, schema: EcoRewardPolicySchema },
      { name: LeaderboardReward.name, schema: LeaderboardRewardSchema },
      {
        name: LeaderboardRewardPolicy.name,
        schema: LeaderboardRewardPolicySchema,
      },
      {
        name: SystemSetting.name,
        schema: SystemSettingSchema,
      },
    ]),
    BusinessesModule,
    MailerModule,
    GeocodingModule,
  ],
  controllers: [
    AdminBusinessFormController,
    AdminMaterialController,
    AdminCustomerController,
    AdminBusinessController,
    AdminVoucherController,
    AdminEcoRewardPoliciesController,
    AdminLeaderboardPolicyController,
    AdminLeaderboardRewardController,
    AdminSystemSettingController,
  ],
  providers: [
    AdminBusinessFormService,
    AdminMaterialService,
    AdminCustomerService,
    AdminBusinessService,
    AdminVoucherService,
    AdminEcoRewardPoliciesService,
    AdminLeaderboardPolicyService,
    AdminLeaderboardRewardService,
    AdminSystemSettingService,
  ],
})
export class AdminModule {}
