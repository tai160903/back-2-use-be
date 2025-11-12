import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BusinessVouchers } from 'src/modules/businesses/schemas/business-voucher.schema';
import { VouchersStatus } from '../constants/vouchers-status.enum';

@Injectable()
export class BusinessVouchersCronService {
  private readonly logger = new Logger(BusinessVouchersCronService.name);

  constructor(
    @InjectModel(BusinessVouchers.name)
    private readonly businessVoucherModel: Model<BusinessVouchers>,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async handleVoucherStatusUpdate() {
    const now = new Date();
    this.logger.debug(
      `Running voucher status update job at ${now.toISOString()}`,
    );

    // 1️⃣ inactive → active
    const activated = await this.businessVoucherModel.updateMany(
      {
        status: VouchersStatus.INACTIVE,
        startDate: { $lte: now },
        endDate: { $gt: now },
      },
      { $set: { status: VouchersStatus.ACTIVE, isPublished: true } },
    );

    // 2️⃣ active → expired
    const expired = await this.businessVoucherModel.updateMany(
      {
        status: VouchersStatus.ACTIVE,
        endDate: { $lte: now },
      },
      { $set: { status: VouchersStatus.EXPIRED } },
    );

    if (activated.modifiedCount || expired.modifiedCount) {
      this.logger.log(
        `✅ Updated vouchers — activated: ${activated.modifiedCount}, expired: ${expired.modifiedCount}`,
      );
    } else {
      this.logger.log(`No voucher status changes at this time.`);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async unpublishExpiredVouchers() {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const result = await this.businessVoucherModel.updateMany(
      {
        status: VouchersStatus.EXPIRED,
        isPublished: true,
        endDate: { $lte: sevenDaysAgo },
      },
      { $set: { isPublished: false } },
    );

    if (result.modifiedCount > 0) {
      this.logger.log(
        `🧹 Unpublished ${result.modifiedCount} expired vouchers older than 7 days.`,
      );
    }
  }
}
