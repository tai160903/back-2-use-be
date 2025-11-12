import { Module } from '@nestjs/common';
import {
  BusinessVouchers,
  BusinessVouchersSchema,
} from 'src/modules/businesses/schemas/business-voucher.schema';
import { BusinessVouchersCronService } from './business-vouchers.cron';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessVouchers.name, schema: BusinessVouchersSchema },
    ]),
  ],
  providers: [BusinessVouchersCronService],
})
export class CronModule {}
