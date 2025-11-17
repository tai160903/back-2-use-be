import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminMonthlyLeaderboardsService } from '../services/admin-monthly-leaderboards.service';
import { GetMonthlyLeaderboardQueryDto } from '../dto/admin-leaderboard/get-monthly-leaderboard-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { MonthlyLeaderboard } from 'src/modules/monthly-leaderboards/schemas/monthly-leaderboards.schema';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';

@ApiTags('Monthly Leaderboard (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/monthly-leaderboards')
export class AdminMonthlyLeaderboardsController {
  constructor(
    private readonly monthlyLeaderboardService: AdminMonthlyLeaderboardsService,
  ) {}

  //   GET admin/monthly-leaderboards
  @Get()
  async getLeaderboard(
    @Query() query: GetMonthlyLeaderboardQueryDto,
  ): Promise<APIPaginatedResponseDto<MonthlyLeaderboard[]>> {
    return this.monthlyLeaderboardService.getLeaderboard(query);
  }
}
