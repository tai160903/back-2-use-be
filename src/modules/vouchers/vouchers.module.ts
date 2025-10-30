import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vouchers, VouchersSchema } from './schema/vouchers.schema';
import { VouchersService } from './vouchers.service';
import { VouchersController } from './vouchers.controller';
import { VoucherCronService } from './voucher-cron.service';
import {
  VoucherCodes,
  VoucherCodesSchema,
} from '../voucher-codes/schema/voucher-codes.schema';
import { Customers, CustomersSchema } from '../users/schemas/customer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vouchers.name, schema: VouchersSchema },
      { name: VoucherCodes.name, schema: VoucherCodesSchema },
      { name: Customers.name, schema: CustomersSchema },
    ]),
  ],
  controllers: [VouchersController],
  providers: [VouchersService, VoucherCronService],
  exports: [VouchersService],
})
export class VouchersModule {}
