import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as QRCode from 'qrcode';
import { MonthlyLeaderboard } from 'src/modules/monthly-leaderboards/schemas/monthly-leaderboards.schema';
import { LeaderboardRewardPolicy } from 'src/modules/leaderboard-reward-policies/schema/leaderboard-reward-policies.schema';
import { LeaderboardReward } from 'src/modules/leaderboard-reward/schema/leaderboard-rewards.schema';
import { VoucherCodes } from 'src/modules/voucher-codes/schema/voucher-codes.schema';
import { Vouchers } from 'src/modules/vouchers/schema/vouchers.schema';
import { generateRandomString } from '../utils/generate-random-string.util';
import { VoucherCodeStatus } from '../constants/voucher-codes-status.enum';
import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';

@Injectable()
export class LeaderboardRewardCron {
  private readonly logger = new Logger(LeaderboardRewardCron.name);

  constructor(
    @InjectModel(MonthlyLeaderboard.name)
    private monthlyLeaderboardModel: Model<MonthlyLeaderboard>,

    @InjectModel(LeaderboardRewardPolicy.name)
    private rewardPolicyModel: Model<LeaderboardRewardPolicy>,

    @InjectModel(LeaderboardReward.name)
    private rewardModel: Model<LeaderboardReward>,

    @InjectModel(VoucherCodes.name)
    private voucherCodeModel: Model<VoucherCodes>,

    @InjectModel(Vouchers.name)
    private voucherModel: Model<Vouchers>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  @Cron('*/2 * * * *')
  async distributeRewards() {
    this.logger.log('🔥 Leaderboard Reward Cron Running...');

    const now = new Date();
    let month = now.getMonth();
    let year = now.getFullYear();

    if (month === 0) {
      month = 12;
      year -= 1;
    }

    this.logger.log(`Processing reward for ${month}/${year}`);

    // 1. Lấy toàn bộ policy tháng đó
    const policies = await this.rewardPolicyModel.find({ month, year });
    if (policies.length === 0) {
      this.logger.log('⛔ No reward policies for this month');
      return;
    }

    for (const policy of policies) {
      this.logger.log(
        `⏳ Policy: voucher=${policy.voucherId}, rank ${policy.rankFrom}-${policy.rankTo}`,
      );

      // 2. Lấy top customer theo range
      const leaders = await this.monthlyLeaderboardModel.find({
        month,
        year,
        rank: { $gte: policy.rankFrom, $lte: policy.rankTo },
      });

      // 3. Lấy voucher
      const voucher = await this.voucherModel.findById(policy.voucherId);
      if (!voucher) {
        this.logger.error(`Voucher not found: ${policy.voucherId}`);
        continue;
      }

      for (const leader of leaders) {
        const customerId = leader.customerId as Types.ObjectId;

        // 4. Check tránh phát trùng
        const exist = await this.rewardModel.findOne({
          leaderboardId: leader._id,
          rewardPolicyId: policy._id,
        });

        if (exist) {
          this.logger.warn(
            `⚠ Already rewarded leaderboard ${leader._id}, skip`,
          );
          continue;
        }

        // 5. Generate voucher code
        let voucherCode;
        const now = new Date();

        const leaderboardExpireAt = new Date();
        leaderboardExpireAt.setDate(leaderboardExpireAt.getDate() + 7);

        for (let i = 0; i < 3; i++) {
          const suffix = generateRandomString(6);
          const fullCode = `${voucher.baseCode}-${suffix}`;

          try {
            voucherCode = await this.voucherCodeModel.create({
              voucherId: voucher._id,
              voucherType: voucher.voucherType,
              fullCode,
              redeemedBy: customerId,
              status: VoucherCodeStatus.REDEEMED,
              redeemedAt: new Date(),
              leaderboardExpireAt,
            });
            break;
          } catch (err: any) {
            if (err.code === 11000) continue; // retry code duplicate
            throw err;
          }
        }

        if (!voucherCode) {
          this.logger.error('❌ Failed to generate voucherCode');
          continue;
        }

        // 6. Generate QR
        const voucherCodeId = voucherCode._id.toString();

        const qrCodeBuffer = await QRCode.toBuffer(voucherCodeId, {
          errorCorrectionLevel: 'M',
          type: 'png',
          width: 300,
          margin: 1,
        });

        // upload lên Cloudinary
        const uploadResult = await this.cloudinaryService.uploadQRCode(
          qrCodeBuffer,
          voucherCodeId,
          'vouchers/qrcodes',
        );

        // Lưu URL
        voucherCode.qrCode = uploadResult.secure_url;
        await voucherCode.save();

        // 7. Lưu record LeaderboardReward
        await this.rewardModel.create({
          leaderboardId: leader._id,
          rewardPolicyId: policy._id,
          voucherCodeId: voucherCode._id,
          rewardedAt: new Date(),
          note: 'Monthly leaderboard reward',
        });

        this.logger.log(
          `🎁 Rewarded customer ${customerId} with voucherCode ${voucherCode.fullCode}`,
        );
      }
    }

    this.logger.log('🎉 Leaderboard Reward Cron Finished');
  }
}
