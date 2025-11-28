import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Product } from './entities/product.entity';
import { ProductSchema } from './schemas/product.schema';
import {
  ProductGroup,
  ProductGroupSchema,
} from '../product-groups/schemas/product-group.schema';
import {
  ProductSize,
  ProductSizeSchema,
} from '../product-sizes/schemas/product-size.schema';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import {
  BusinessSubscriptions,
  BusinessSubscriptionsSchema,
} from '../businesses/schemas/business-subscriptions.schema';
import {
  Subscriptions,
  SubscriptionsSchema,
} from '../subscriptions/schemas/subscriptions.schema';
import { CloudinaryModule } from 'src/infrastructure/cloudinary/cloudinary.module';
import { Users, UsersSchema } from '../users/schemas/users.schema';
import {
  BorrowTransaction,
  BorrowTransactionSchema,
} from '../borrow-transactions/schemas/borrow-transactions.schema';
import {
  SystemSetting,
  SystemSettingSchema,
} from '../system-settings/schemas/system-setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema },
      { name: ProductGroup.name, schema: ProductGroupSchema },
      { name: ProductSize.name, schema: ProductSizeSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: BusinessSubscriptions.name, schema: BusinessSubscriptionsSchema },
      { name: Subscriptions.name, schema: SubscriptionsSchema },
      { name: Users.name, schema: UsersSchema },
      { name: BorrowTransaction.name, schema: BorrowTransactionSchema },
      { name: SystemSetting.name, schema: SystemSettingSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
