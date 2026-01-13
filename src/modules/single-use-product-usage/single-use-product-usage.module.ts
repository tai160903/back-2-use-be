import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SingleUseProductSize,
  SingleUseProductSizeSchema,
} from '../single-use-product-size/schemas/single-use-product-size.schema';
import {
  SingleUseProductType,
  SingleUseProductTypeSchema,
} from '../single-use-product-type/schemas/single-use-product-type.schema';
import { Material, MaterialSchema } from '../materials/schemas/material.schema';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import { SingleUseProductUsageController } from './single-use-product-usage.controller';
import {
  SingleUseProduct,
  SingleUseProductSchema,
} from '../single-use-product/schemas/single-use-product.schema';
import { SingleUseProductUsageService } from './single-use-product-usage.service';
import {
  BorrowTransaction,
  BorrowTransactionSchema,
} from '../borrow-transactions/schemas/borrow-transactions.schema';
import {
  SingleUseProductUsage,
  SingleUseProductUsageSchema,
} from './schemas/single-use-product-usage.schema';
import { Staff, StaffSchema } from '../staffs/schemas/staffs.schema';
import { Customers, CustomersSchema } from '../users/schemas/customer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BorrowTransaction.name, schema: BorrowTransactionSchema },
      { name: SingleUseProductUsage.name, schema: SingleUseProductUsageSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: Staff.name, schema: StaffSchema },
      { name: Customers.name, schema: CustomersSchema },
    ]),
  ],
  controllers: [SingleUseProductUsageController],
  providers: [SingleUseProductUsageService],
})
export class SingleUseProductUsageModule {}
