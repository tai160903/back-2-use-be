import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Vouchers, VouchersDocument } from './schema/vouchers.schema';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';

@Injectable()
export class VoucherCronService {
  private readonly logger = new Logger(VoucherCronService.name);

  constructor(
    @InjectModel(Vouchers.name)
    private readonly voucherModel: Model<VouchersDocument>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpireVouchers() {
    const now = new Date();

    try {
      // Tìm voucher đã hết hạn nhưng vẫn còn active
      const expiredVouchers = await this.voucherModel.find({
        endDate: { $lt: now },
        status: VouchersStatus.ACTIVE,
      });

      if (expiredVouchers.length === 0) {
        this.logger.debug('⏳ No vouchers to expire at this time.');
        return;
      }

      // Cập nhật status sang expired
      const result = await this.voucherModel.updateMany(
        { endDate: { $lt: now }, status: VouchersStatus.ACTIVE },
        { $set: { status: VouchersStatus.EXPIRED } },
      );

      this.logger.log(
        `✅ ${result.modifiedCount} voucher(s) marked as expired at ${now.toISOString()}`,
      );
    } catch (error) {
      this.logger.error(
        `❌ Failed to update expired vouchers at ${now.toISOString()}`,
        error?.stack || error?.message,
      );
    }
  }
}
