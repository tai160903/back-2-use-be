import { Module } from '@nestjs/common';
import {
  BusinessVouchers,
  BusinessVouchersSchema,
} from 'src/modules/businesses/schemas/business-voucher.schema';
import { BusinessVouchersCronService } from './business-vouchers.cron';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VoucherCodes,
  VoucherCodesSchema,
} from 'src/modules/voucher-codes/schema/voucher-codes.schema';
import { MonthlyLeaderboardService } from './monthly-leaderboard.cron';
import {
  MonthlyLeaderboard,
  MonthlyLeaderboardSchema,
} from 'src/modules/monthly-leaderboards/schemas/monthly-leaderboards.schema';
import {
  Customers,
  CustomersSchema,
} from 'src/modules/users/schemas/customer.schema';
import { LeaderboardRewardCron } from './leaderboard-reward.cron';
import {
  LeaderboardReward,
  LeaderboardRewardSchema,
} from 'src/modules/leaderboard-reward/schema/leaderboard-rewards.schema';
import {
  LeaderboardRewardPolicy,
  LeaderboardRewardPolicySchema,
} from 'src/modules/leaderboard-reward-policies/schema/leaderboard-reward-policies.schema';
import {
  Vouchers,
  VouchersSchema,
} from 'src/modules/vouchers/schema/vouchers.schema';
import { CloudinaryModule } from 'src/infrastructure/cloudinary/cloudinary.module';
import { VoucherCodesLeaderboardCronService } from './leaderboard-voucher.cron';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessVouchers.name, schema: BusinessVouchersSchema },
      { name: VoucherCodes.name, schema: VoucherCodesSchema },
      { name: Vouchers.name, schema: VouchersSchema },
      { name: MonthlyLeaderboard.name, schema: MonthlyLeaderboardSchema },
      { name: LeaderboardReward.name, schema: LeaderboardRewardSchema },
      {
        name: LeaderboardRewardPolicy.name,
        schema: LeaderboardRewardPolicySchema,
      },
      { name: Customers.name, schema: CustomersSchema },
    ]),
    CloudinaryModule,
  ],
  providers: [
    BusinessVouchersCronService,
    MonthlyLeaderboardService,
    LeaderboardRewardCron,
    VoucherCodesLeaderboardCronService,
  ],
})
export class CronModule {}
