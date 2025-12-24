import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import * as QRCode from 'qrcode';

import { MonthlyLeaderboard } from 'src/modules/monthly-leaderboards/schemas/monthly-leaderboards.schema';
import { LeaderboardRewardPolicy } from 'src/modules/leaderboard-reward-policies/schema/leaderboard-reward-policies.schema';
import { LeaderboardReward } from 'src/modules/leaderboard-reward/schema/leaderboard-rewards.schema';
import { VoucherCodes } from 'src/modules/voucher-codes/schema/voucher-codes.schema';
import { Vouchers } from 'src/modules/vouchers/schema/vouchers.schema';

import { CloudinaryService } from 'src/infrastructure/cloudinary/cloudinary.service';
import { generateRandomString } from 'src/common/utils/generate-random-string.util';
import { VoucherCodeStatus } from 'src/common/constants/voucher-codes-status.enum';

@Injectable()
export class LeaderboardRewardCron {
  private readonly logger = new Logger(LeaderboardRewardCron.name);

  constructor(
    @InjectModel(MonthlyLeaderboard.name)
    private readonly monthlyLeaderboardModel: Model<MonthlyLeaderboard>,

    @InjectModel(LeaderboardRewardPolicy.name)
    private readonly rewardPolicyModel: Model<LeaderboardRewardPolicy>,

    @InjectModel(LeaderboardReward.name)
    private readonly rewardModel: Model<LeaderboardReward>,

    @InjectModel(VoucherCodes.name)
    private readonly voucherCodeModel: Model<VoucherCodes>,

    @InjectModel(Vouchers.name)
    private readonly voucherModel: Model<Vouchers>,

    private readonly cloudinaryService: CloudinaryService,
  ) {}

  // chạy test mỗi 5 phút
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

    this.logger.log(`📌 Processing rewards for ${month}/${year}`);

    const policies = await this.rewardPolicyModel.find({ month, year });

    if (policies.length === 0) {
      this.logger.log('⛔ No policies found');
      return;
    }

    for (const policy of policies) {
      if (policy.isDistributed) {
        this.logger.log(`✔ Policy ${policy._id} already distributed → skip`);
        continue;
      }

      this.logger.log(
        `➡ Policy ${policy._id} (rank ${policy.rankFrom}-${policy.rankTo})`,
      );

      // ===== GET LEADERS =====
      const leaders = await this.monthlyLeaderboardModel.find({
        month,
        year,
        rank: { $gte: policy.rankFrom, $lte: policy.rankTo },
      });

      if (leaders.length === 0) {
        this.logger.warn(`⚠ No leaders found for policy ${policy._id}`);
        continue;
      }

      // ===== GET VOUCHER =====
      const voucher = await this.voucherModel.findById(policy.voucherId);
      if (!voucher) {
        this.logger.error(`❌ Voucher not found: ${policy.voucherId}`);
        continue;
      }

      let successCount = 0;

      // ===== DISTRIBUTE =====
      for (const leader of leaders) {
        const customerId = leader.customerId as Types.ObjectId;

        // tránh phát trùng
        const existed = await this.rewardModel.findOne({
          leaderboardId: leader._id,
          rewardPolicyId: policy._id,
        });

        if (existed) {
          successCount++;
          continue;
        }

        // ----- CREATE VOUCHER CODE -----
        let voucherCode;

        const leaderboardExpireAt = new Date();
        leaderboardExpireAt.setDate(leaderboardExpireAt.getDate() + 28);

        for (let attempt = 0; attempt < 5; attempt++) {
          try {
            const suffix = generateRandomString(6);
            const fullCode = `${voucher.baseCode}-${suffix}`;

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
            if (err.code === 11000) {
              this.logger.warn('⚠ Duplicate voucherCode, retrying...');
              continue;
            }
            this.logger.error('❌ VoucherCode create failed', err);
            break;
          }
        }

        if (!voucherCode) {
          this.logger.error(
            `❌ Failed to generate voucherCode for customer ${customerId}`,
          );
          continue;
        }

        // ----- QR CODE -----
        try {
          const qrBuffer = await QRCode.toBuffer(voucherCode._id.toString(), {
            errorCorrectionLevel: 'M',
            width: 300,
            margin: 1,
          });

          const upload = await this.cloudinaryService.uploadQRCode(
            qrBuffer,
            voucherCode._id.toString(),
            'vouchers/qrcodes',
          );

          voucherCode.qrCode = upload.secure_url;
          await voucherCode.save();
        } catch (err) {
          this.logger.error('❌ QRCode generation failed', err);
          continue;
        }

        // ----- SAVE REWARD -----
        await this.rewardModel.create({
          leaderboardId: leader._id,
          rewardPolicyId: policy._id,
          voucherCodeId: voucherCode._id,
          rewardedAt: new Date(),
          note: 'Monthly leaderboard reward',
        });

        successCount++;

        this.logger.log(
          `🎁 Rewarded customer ${customerId} with ${voucherCode.fullCode}`,
        );
      }

      // ===== FINALIZE POLICY =====
      if (successCount === leaders.length) {
        policy.isDistributed = true;
        policy.distributedAt = new Date();
        await policy.save();

        this.logger.log(
          `✔ Policy ${policy._id} fully distributed (${successCount}/${leaders.length})`,
        );
      } else {
        this.logger.warn(
          `⚠ Policy ${policy._id} NOT fully distributed (${successCount}/${leaders.length})`,
        );
      }
    }

    this.logger.log('🎉 Leaderboard Reward Cron Finished');
  }
}
