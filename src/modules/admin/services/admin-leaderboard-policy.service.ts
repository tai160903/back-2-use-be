import { Model, Types } from 'mongoose';
import {
  Injectable,
  Inject,
  NotFoundException,
  BadRequestException,
  HttpStatus,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  LeaderboardRewardPolicy,
  LeaderboardRewardPolicyDocument,
} from 'src/modules/leaderboard-reward-policies/schema/leaderboard-reward-policies.schema';
import {
  Vouchers,
  VouchersDocument,
} from 'src/modules/vouchers/schema/vouchers.schema';
import { CreateLeaderboardRewardPolicyDto } from '../dto/admin-leaderboard/create-leaderboard-policy.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { VoucherType } from 'src/common/constants/voucher-types.enum';
import { GetLeaderboardRewardPolicyQueryDto } from '../dto/admin-leaderboard/get-leaderboard-policy-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { paginate } from 'src/common/utils/pagination.util';

@Injectable()
export class AdminLeaderboardPolicyService {
  constructor(
    @InjectModel(LeaderboardRewardPolicy.name)
    private readonly leaderboardPolicyModel: Model<LeaderboardRewardPolicy>,

    @InjectModel(Vouchers.name)
    private readonly voucherModel: Model<VouchersDocument>,
  ) {}

  // Admin create policy
  async createPolicy(
    dto: CreateLeaderboardRewardPolicyDto,
  ): Promise<APIResponseDto<LeaderboardRewardPolicy>> {
    const { voucherId, month, year, rankFrom, rankTo, note } = dto;

    const voucher = await this.voucherModel.findById(voucherId);
    if (!voucher) {
      throw new NotFoundException(`Voucher '${voucherId}' not found.`);
    }

    if (voucher.voucherType !== VoucherType.LEADERBOARD) {
      throw new BadRequestException(
        `Voucher '${voucherId}' is not a leaderboard voucher.`,
      );
    }

    if (rankFrom > rankTo) {
      throw new BadRequestException(
        `rankFrom (${rankFrom}) must be <= rankTo (${rankTo}).`,
      );
    }

    const overlap = await this.leaderboardPolicyModel.findOne({
      month,
      year,
      $or: [
        {
          rankFrom: { $lte: rankTo },
          rankTo: { $gte: rankFrom },
        },
      ],
    });

    if (overlap) {
      throw new BadRequestException(
        `Rank range ${rankFrom}–${rankTo} overlaps with existing policy ${overlap.rankFrom}–${overlap.rankTo}.`,
      );
    }

    const policy = await this.leaderboardPolicyModel.create({
      voucherId: new Types.ObjectId(voucherId),
      month,
      year,
      rankFrom,
      rankTo,
      note: note ?? null,
    });

    return {
      statusCode: HttpStatus.OK,
      message: `Created leaderboard reward policy for month ${month}/${year} (Rank ${rankFrom}–${rankTo}) successfully`,
      data: policy,
    };
  }

  // Admin get policy
  async getPolicies(
    query: GetLeaderboardRewardPolicyQueryDto,
  ): Promise<APIPaginatedResponseDto<LeaderboardRewardPolicy[]>> {
    const { month, year, rankFrom, rankTo, page = 1, limit = 10 } = query;

    // --- Validation: nếu cả 2 cùng tồn tại thì rankFrom phải <= rankTo ---
    if (typeof rankFrom !== 'undefined' && typeof rankTo !== 'undefined') {
      if (rankFrom > rankTo) {
        throw new BadRequestException(
          `rankFrom (${rankFrom}) must be less than or equal to rankTo (${rankTo}).`,
        );
      }
    }

    const filter: any = {};

    if (month) filter.month = month;
    if (year) filter.year = year;

    // --- Rank range filter ---
    if (typeof rankFrom !== 'undefined' || typeof rankTo !== 'undefined') {
      filter.$and = [];

      if (typeof rankFrom !== 'undefined') {
        filter.$and.push({
          rankTo: { $gte: rankFrom }, // Policy must reach at least rankFrom
        });
      }

      if (typeof rankTo !== 'undefined') {
        filter.$and.push({
          rankFrom: { $lte: rankTo }, // Policy must start before rankTo
        });
      }

      // Nếu chỉ có $and rỗng (không xảy ra nhưng phòng trường hợp), xoá nó
      if (filter.$and.length === 0) {
        delete filter.$and;
      }
    }

    // --- Sort ---
    const sort: Record<string, 1 | -1> = {
      year: -1,
      month: -1,
      rankFrom: 1,
    };

    const { data, total, totalPages, currentPage } = await paginate(
      this.leaderboardPolicyModel,
      filter,
      page,
      limit,
      undefined,
      sort,
      {
        path: 'voucherId',
        select: 'name description baseCode discountPercent voucherType',
      },
    );

    return {
      statusCode: 200,
      message: 'Get leaderboard reward policies successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }
}
