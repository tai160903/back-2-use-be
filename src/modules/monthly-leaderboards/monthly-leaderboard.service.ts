import { Model } from 'mongoose';
import { Injectable, Inject, HttpStatus } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { MonthlyLeaderboard } from './schemas/monthly-leaderboards.schema';
import { GetMonthlyLeaderboardQueryDto } from './dto/get-monthly-leaderboard-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { paginate } from 'src/common/utils/pagination.util';

@Injectable()
export class MonthlyLeaderboardsService {
  constructor(
    @InjectModel(MonthlyLeaderboard.name)
    private readonly monthlyLeaderboardModel: Model<MonthlyLeaderboard>,
  ) {}

  async getLeaderboard(
    query: GetMonthlyLeaderboardQueryDto,
  ): Promise<APIPaginatedResponseDto<MonthlyLeaderboard[]>> {
    const {
      month,
      year,
      rankMin,
      rankMax,
      minPoints,
      maxPoints,
      page = 1,
      limit = 10,
    } = query;

    const filter: any = {};

    if (month) filter.month = month;
    if (year) filter.year = year;

    if (rankMin || rankMax) {
      filter.rank = {};
      if (rankMin) filter.rank.$gte = rankMin;
      if (rankMax) filter.rank.$lte = rankMax;
    }

    if (minPoints || maxPoints) {
      filter.rankingPoints = {};
      if (minPoints) filter.rankingPoints.$gte = minPoints;
      if (maxPoints) filter.rankingPoints.$lte = maxPoints;
    }

    // ---- Sort mặc định theo rank ASC ----
    const sort: Record<string, 1 | -1> = {
      year: -1,
      month: -1,
      rank: 1,
    };

    const populate = {
      path: 'customerId',
      select: 'fullName phone address yob userId',
      populate: {
        path: 'userId',
        select: 'avatar',
      },
    };

    const { data, total, totalPages, currentPage } = await paginate(
      this.monthlyLeaderboardModel,
      filter,
      page,
      limit,
      undefined,
      sort,
      populate,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Get monthly leaderboard successfully',
      data,
      total,
      currentPage,
      totalPages,
    };
  }
}
