import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { VoucherCodeStatus } from 'src/common/constants/voucher-codes-status.enum';
import {
  VoucherCodes,
  VoucherCodesDocument,
} from 'src/modules/voucher-codes/schema/voucher-codes.schema';
import { VoucherType } from 'src/common/constants/voucher-types.enum';

@Injectable()
export class VoucherCodesLeaderboardCronService {
  private readonly logger = new Logger(VoucherCodesLeaderboardCronService.name);

  constructor(
    @InjectModel(VoucherCodes.name)
    private readonly voucherCodeModel: Model<VoucherCodesDocument>,
  ) {}

  /**
   * Cron chạy mỗi phút để cập nhật voucher code của leaderboard
   * Tự động chuyển:
   *  - REDEEMED → EXPIRED nếu quá leaderboardExpireAt
   *  - Giữ nguyên USED
   */
  @Cron(CronExpression.EVERY_MINUTE)
  async handleLeaderboardVoucherExpiration() {
    const now = new Date();

    // Lấy các voucher LEADERBOARD đã hết hạn nhưng vẫn đang trạng thái REDEEMED
    const expirableCodes = await this.voucherCodeModel.find({
      voucherType: VoucherType.LEADERBOARD,
      status: VoucherCodeStatus.REDEEMED,
      leaderboardExpireAt: { $lte: now },
    });

    if (expirableCodes.length === 0) {
      this.logger.debug(
        `No leaderboard vouchers to expire at ${now.toISOString()}`,
      );
      return;
    }

    const ids = expirableCodes.map((v) => v._id);

    const updated = await this.voucherCodeModel.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          status: VoucherCodeStatus.EXPIRED,
          expiredAt: now,
        },
      },
    );

    this.logger.log(
      `Expired ${updated.modifiedCount} leaderboard voucher codes at ${now.toISOString()}`,
    );
  }
}
