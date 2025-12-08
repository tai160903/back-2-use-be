import { Module } from '@nestjs/common';
import { BorrowTransactionsService } from './borrow-transactions.service';
import { BorrowTransactionsController } from './borrow-transactions.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BorrowTransaction,
  BorrowTransactionSchema,
} from './schemas/borrow-transactions.schema';
import { CloudinaryModule } from 'src/infrastructure/cloudinary/cloudinary.module';
import { Wallets, WalletsSchema } from '../wallets/schemas/wallets.schema';
import { UsersModule } from '../users/users.module';
import {
  WalletTransactions,
  WalletTransactionsSchema,
} from '../wallet-transactions/schema/wallet-transactions.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';
import {
  ProductSize,
  ProductSizeSchema,
} from '../product-sizes/schemas/product-size.schema';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import {
  ProductGroup,
  ProductGroupSchema,
} from '../product-groups/schemas/product-group.schema';
import {
  SystemSetting,
  SystemSettingSchema,
} from '../system-settings/schemas/system-setting.schema';
import { Material, MaterialSchema } from '../materials/schemas/material.schema';
import { Staff, StaffSchema } from '../staffs/schemas/staffs.schema';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BorrowTransaction.name, schema: BorrowTransactionSchema },
      { name: Wallets.name, schema: WalletsSchema },
      { name: WalletTransactions.name, schema: WalletTransactionsSchema },
      { name: Material.name, schema: MaterialSchema },
      { name: Product.name, schema: ProductSchema },
      { name: ProductSize.name, schema: ProductSizeSchema },
      { name: ProductGroup.name, schema: ProductGroupSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: SystemSetting.name, schema: SystemSettingSchema },
      { name: Staff.name, schema: StaffSchema },
    ]),
    UsersModule,
    CloudinaryModule,
    NotificationsModule,
  ],
  controllers: [BorrowTransactionsController],
  providers: [BorrowTransactionsService],
})
export class BorrowTransactionsModule {}
