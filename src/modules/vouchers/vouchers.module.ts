import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Vouchers, VouchersSchema } from './schema/vouchers.schema';
import { VouchersService } from './vouchers.service';
import { VoucherCronService } from './voucher-cron.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Vouchers.name, schema: VouchersSchema },
    ]),
  ],
  providers: [VouchersService, VoucherCronService],
  exports: [VouchersService],
})
export class VouchersModule {}
