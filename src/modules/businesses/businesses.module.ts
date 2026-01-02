import { Module } from '@nestjs/common';
import { BusinessesService } from './services/businesses.service';
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
import { MailerModule } from 'src/infrastructure/mailer/mailer.module';
import { Customers, CustomersSchema } from '../users/schemas/customer.schema';
import { BusinessSubscriptionGuard } from 'src/common/guards/business-subscription.guard';
import { GeocodingModule } from 'src/infrastructure/geocoding/geocoding.module';

import { Product, ProductSchema } from '../products/schemas/product.schema';
import {
  ProductGroup,
  ProductGroupSchema,
} from '../product-groups/schemas/product-group.schema';
import {
  BusinessVouchers,
  BusinessVouchersSchema,
} from './schemas/business-voucher.schema';
import { BusinessVoucherController } from './controller/businesses-voucher.controller';
import { BusinessVoucherService } from './services/businesses-voucher.service';
import {
  EcoRewardPolicy,
  EcoRewardPolicySchema,
} from '../eco-reward-policies/schemas/eco-reward-policy.schema';
import { Vouchers, VouchersSchema } from '../vouchers/schema/vouchers.schema';
import { BusinessesController } from './controller/businesses.controller';
import {
  VoucherCodes,
  VoucherCodesSchema,
} from '../voucher-codes/schema/voucher-codes.schema';
import { Staff, StaffSchema } from '../staffs/schemas/staffs.schema';
import { BusinessDashboardController } from './controller/business-dashboard.controller';
import { BusinessDashboardService } from './services/business-dashboard.service';
import {
  BorrowTransaction,
  BorrowTransactionSchema,
} from '../borrow-transactions/schemas/borrow-transactions.schema';
import { Material, MaterialSchema } from '../materials/schemas/material.schema';
import { Feedback, FeedbackSchema } from '../feedback/schemas/feedback.schema';
import {
  SingleUseProductSize,
  SingleUseProductSizeSchema,
} from '../single-use-product-size/schemas/single-use-product-size.schema';
import {
  SingleUseProductType,
  SingleUseProductTypeSchema,
} from '../single-use-product-type/schemas/single-use-product-type.schema';
import {
  SingleUseProduct,
  SingleUseProductSchema,
} from '../single-use-product/schemas/single-use-product.schema';
import { BusinessSingleUseProductService } from './services/business-single-use-product.service';
import { BusinessSingleUseProductController } from './controller/business-single-use-product.controller';
import { BusinessSingleUseUsageController } from './controller/business-single-use-product-usage.controller';
import { BusinessSingleUseUsageService } from './services/business-single-use-product-usage.service';
import {
  SingleUseProductUsage,
  SingleUseProductUsageSchema,
} from '../single-use-product-usage/schemas/single-use-product-usage.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessForm.name, schema: BusinessFormSchema },
      {
        name: Businesses.name,
        schema: BusinessesSchema,
      },
      { name: BusinessSubscriptions.name, schema: BusinessSubscriptionsSchema },
      { name: Customers.name, schema: CustomersSchema },
      { name: Notification.name, schema: NotificationsSchema },
      { name: Subscriptions.name, schema: SubscriptionsSchema },
      { name: Users.name, schema: UsersSchema },
      { name: WalletTransactions.name, schema: WalletTransactionsSchema },
      { name: Wallets.name, schema: WalletsSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductGroup.name, schema: ProductGroupSchema },
      { name: BusinessVouchers.name, schema: BusinessVouchersSchema },
      { name: EcoRewardPolicy.name, schema: EcoRewardPolicySchema },
      { name: Vouchers.name, schema: VouchersSchema },
      { name: VoucherCodes.name, schema: VoucherCodesSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: BorrowTransaction.name, schema: BorrowTransactionSchema },
      { name: Material.name, schema: MaterialSchema },
      { name: Feedback.name, schema: FeedbackSchema },
      { name: SingleUseProductSize.name, schema: SingleUseProductSizeSchema },
      { name: SingleUseProductType.name, schema: SingleUseProductTypeSchema },
      { name: SingleUseProduct.name, schema: SingleUseProductSchema },
      { name: SingleUseProductUsage.name, schema: SingleUseProductUsageSchema },
    ]),
    CloudinaryModule,
    MailerModule,
    NotificationsModule,
    GeocodingModule,
  ],
  controllers: [
    BusinessesController,
    BusinessVoucherController,
    BusinessDashboardController,
    BusinessSingleUseProductController,
    BusinessSingleUseUsageController,
  ],
  providers: [
    BusinessesService,
    BusinessVoucherService,
    BusinessDashboardService,
    BusinessSingleUseProductService,
    BusinessSingleUseUsageService,
    BusinessSubscriptionGuard,
  ],
  exports: [BusinessesService],
})
export class BusinessesModule {}
