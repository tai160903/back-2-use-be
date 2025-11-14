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

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessVouchers.name, schema: BusinessVouchersSchema },
      { name: VoucherCodes.name, schema: VoucherCodesSchema },
    ]),
  ],
  providers: [BusinessVouchersCronService],
})
export class CronModule {}
