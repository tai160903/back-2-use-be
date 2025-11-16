import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vouchers, VouchersSchema } from './schema/vouchers.schema';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';
import {
  VoucherCodes,
  VoucherCodesSchema,
} from '../voucher-codes/schema/voucher-codes.schema';
import { Customers, CustomersSchema } from '../users/schemas/customer.schema';
import {
  BusinessVouchers,
  BusinessVouchersSchema,
} from '../businesses/schemas/business-voucher.schema';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import { CloudinaryModule } from 'src/infrastructure/cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vouchers.name, schema: VouchersSchema },
      { name: VoucherCodes.name, schema: VoucherCodesSchema },
      { name: Customers.name, schema: CustomersSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: BusinessVouchers.name, schema: BusinessVouchersSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [VouchersController],
  providers: [VouchersService],
  exports: [VouchersService],
})
export class VouchersModule {}
