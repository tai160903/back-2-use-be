import { Module } from '@nestjs/common';
import {
  BusinessVouchers,
  BusinessVouchersSchema,
} from 'src/modules/businesses/schemas/business-voucher.schema';
import { MongooseModule } from '@nestjs/mongoose';
import {
  VoucherCodes,
  VoucherCodesSchema,
} from 'src/modules/voucher-codes/schema/voucher-codes.schema';
import { MonthlyLeaderboardService } from './voucher/monthly-leaderboard.cron';
import {
  MonthlyLeaderboard,
  MonthlyLeaderboardSchema,
} from 'src/modules/monthly-leaderboards/schemas/monthly-leaderboards.schema';
import {
  Customers,
  CustomersSchema,
} from 'src/modules/users/schemas/customer.schema';
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
import { BusinessVouchersCronService } from './voucher/business-vouchers.cron';
import { LeaderboardRewardCron } from './voucher/leaderboard-reward.cron';
import { VoucherCodesLeaderboardCronService } from './voucher/leaderboard-voucher.cron';
import { LateTransactionCron } from './return_borrow/late-transaction-cron';
import {
  BorrowTransaction,
  BorrowTransactionSchema,
} from 'src/modules/borrow-transactions/schemas/borrow-transactions.schema';
import {
  Product,
  ProductSchema,
} from 'src/modules/products/schemas/product.schema';
import {
  Wallets,
  WalletsSchema,
} from 'src/modules/wallets/schemas/wallets.schema';
import {
  WalletTransactions,
  WalletTransactionsSchema,
} from 'src/modules/wallet-transactions/schema/wallet-transactions.schema';
import {
  Businesses,
  BusinessesSchema,
} from 'src/modules/businesses/schemas/businesses.schema';
import {
  ProductGroup,
  ProductGroupSchema,
} from 'src/modules/product-groups/schemas/product-group.schema';
import {
  ProductSize,
  ProductSizeSchema,
} from 'src/modules/product-sizes/schemas/product-size.schema';
import {
  Material,
  MaterialSchema,
} from 'src/modules/materials/schemas/material.schema';

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
      { name: BorrowTransaction.name, schema: BorrowTransactionSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductGroup.name, schema: ProductGroupSchema },
      { name: ProductSize.name, schema: ProductSizeSchema },
      { name: Product.name, schema: ProductSchema },
      { name: Wallets.name, schema: WalletsSchema },
      { name: WalletTransactions.name, schema: WalletTransactionsSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: Customers.name, schema: CustomersSchema },
      { name: Material.name, schema: MaterialSchema },
    ]),
    CloudinaryModule,
  ],
  providers: [
    BusinessVouchersCronService,
    MonthlyLeaderboardService,
    LeaderboardRewardCron,
    LateTransactionCron,
    VoucherCodesLeaderboardCronService,
  ],
})
export class CronModule {}
