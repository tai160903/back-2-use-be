import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { MonthlyLeaderboard } from 'src/modules/monthly-leaderboards/schemas/monthly-leaderboards.schema';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { GetMonthlyLeaderboardQueryDto } from './dto/get-monthly-leaderboard-query.dto';
import { MonthlyLeaderboardsService } from './monthly-leaderboard.service';

@ApiTags('Monthly Leaderboard')
@Controller('monthly-leaderboards')
export class MonthlyLeaderboardsController {
  constructor(
    private readonly monthlyLeaderboardService: MonthlyLeaderboardsService,
  ) {}

  //   GET monthly-leaderboards
  @Get()
  async getLeaderboard(
    @Query() query: GetMonthlyLeaderboardQueryDto,
  ): Promise<APIPaginatedResponseDto<MonthlyLeaderboard[]>> {
    return this.monthlyLeaderboardService.getLeaderboard(query);
  }
}
