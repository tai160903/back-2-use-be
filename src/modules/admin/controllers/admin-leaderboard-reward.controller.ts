import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { GetLeaderboardRewardQueryDto } from '../dto/admin-leaderboard-reward/get-leaderboard-reward-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { LeaderboardReward } from 'src/modules/leaderboard-reward/schema/leaderboard-rewards.schema';
import { AdminLeaderboardRewardService } from '../services/admin-leaderboard-reward.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';

@ApiTags('Leaderboard Reward (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/leaderboard-reward')
export class AdminLeaderboardRewardController {
  constructor(
    private readonly leaderboardRewardService: AdminLeaderboardRewardService,
  ) {}

  //   GET admin/leaderboard-reward
  @Get()
  async getAll(
    @Query() query: GetLeaderboardRewardQueryDto,
  ): Promise<APIPaginatedResponseDto<any>> {
    return this.leaderboardRewardService.get(query);
  }
}
