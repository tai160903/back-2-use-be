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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessVouchers.name, schema: BusinessVouchersSchema },
      { name: VoucherCodes.name, schema: VoucherCodesSchema },
      { name: MonthlyLeaderboard.name, schema: MonthlyLeaderboardSchema },
      { name: Customers.name, schema: CustomersSchema },
    ]),
  ],
  providers: [BusinessVouchersCronService, MonthlyLeaderboardService],
})
export class CronModule {}
