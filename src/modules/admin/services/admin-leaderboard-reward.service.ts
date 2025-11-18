import { Model } from 'mongoose';
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  LeaderboardReward,
  LeaderboardRewardDocument,
} from 'src/modules/leaderboard-reward/schema/leaderboard-rewards.schema';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { GetLeaderboardRewardQueryDto } from '../dto/admin-leaderboard-reward/get-leaderboard-reward-query.dto';
import { paginate } from 'src/common/utils/pagination.util';

@Injectable()
export class AdminLeaderboardRewardService {
  constructor(
    @InjectModel(LeaderboardReward.name)
    private readonly leaderboardRewardModel: Model<LeaderboardRewardDocument>,
  ) {}

  async get(
    query: GetLeaderboardRewardQueryDto,
  ): Promise<APIPaginatedResponseDto<any>> {
    const { page = 1, limit = 10 } = query;

    const filter = {};

    const populate = [
      {
        path: 'leaderboardId',
        select: 'customerId month year rankingPoints rank',
        populate: {
          path: 'customerId',
          select: 'fullName phone address yob',
        },
      },
      {
        path: 'rewardPolicyId',
        select: 'month year rankFrom rankTo note',
      },
      {
        path: 'voucherCodeId',
        select: 'fullCode status redeemedAt leaderboardExpireAt qrCode',
      },
    ];

    const { data, total, currentPage, totalPages } =
      await paginate<LeaderboardRewardDocument>(
        this.leaderboardRewardModel,
        filter,
        page,
        limit,
        undefined,
        undefined,
        populate,
      );

    const formatted = data.map((item: any) => ({
      rewardId: item._id,
      rewardedAt: item.rewardedAt,
      note: item.note,

      leaderboard: item.leaderboardId
        ? {
            month: item.leaderboardId.month,
            year: item.leaderboardId.year,
            rank: item.leaderboardId.rank,
            rankingPoints: item.leaderboardId.rankingPoints,
            customer: item.leaderboardId.customerId
              ? {
                  customerId: item.leaderboardId.customerId._id,
                  fullName: item.leaderboardId.customerId.fullName,
                  phone: item.leaderboardId.customerId.phone,
                  address: item.leaderboardId.customerId.address,
                  yob: item.leaderboardId.customerId.yob,
                }
              : null,
          }
        : null,

      policy: item.rewardPolicyId
        ? {
            month: item.rewardPolicyId.month,
            year: item.rewardPolicyId.year,
            rankFrom: item.rewardPolicyId.rankFrom,
            rankTo: item.rewardPolicyId.rankTo,
            note: item.rewardPolicyId.note,
          }
        : null,

      voucher: item.voucherCodeId
        ? {
            id: item.voucherCodeId._id,
            code: item.voucherCodeId.fullCode,
            status: item.voucherCodeId.status,
            redeemedAt: item.voucherCodeId.redeemedAt,
            expireAt: item.voucherCodeId.leaderboardExpireAt,
            qrCode: item.voucherCodeId.qrCode,
          }
        : null,
    }));

    return {
      statusCode: HttpStatus.OK,
      message: 'Get leaderboard rewards successfully',
      data: formatted,
      total,
      currentPage,
      totalPages,
    };
  }
}
