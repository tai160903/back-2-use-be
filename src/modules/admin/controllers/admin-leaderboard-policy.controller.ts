import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { AdminLeaderboardPolicyService } from '../services/admin-leaderboard-policy.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { CreateLeaderboardRewardPolicyDto } from '../dto/admin-leaderboard/create-leaderboard-policy.dto';
import { LeaderboardRewardPolicy } from 'src/modules/leaderboard-reward-policies/schema/leaderboard-reward-policies.schema';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { GetLeaderboardRewardPolicyQueryDto } from '../dto/admin-leaderboard/get-leaderboard-policy-query.dto';
import { APIPaginatedResponseDto } from 'src/common/dtos/api-paginated-response.dto';
import { UpdateLeaderboardRewardPolicyDto } from '../dto/admin-leaderboard/update-leaderboard-policy.dto';

@ApiTags('Leaderboard Reward Policies (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/leaderboard-policy')
export class AdminLeaderboardPolicyController {
  constructor(
    private readonly leaderboardPolicyService: AdminLeaderboardPolicyService,
  ) {}

  // POST admin/leaderboard-policy
  @Post()
  async createPolicy(
    @Body() dto: CreateLeaderboardRewardPolicyDto,
  ): Promise<APIResponseDto<LeaderboardRewardPolicy>> {
    return this.leaderboardPolicyService.createPolicy(dto);
  }

  // POST admin/leaderboard-policy/:id
  @Patch(':id')
  async updatePolicy(
    @Param('id') id: string,
    @Body() dto: UpdateLeaderboardRewardPolicyDto,
  ) {
    return this.leaderboardPolicyService.updatePolicy(id, dto);
  }

  // GET admin/leaderboard-policy
  @Get()
  async getPolicies(
    @Query() query: GetLeaderboardRewardPolicyQueryDto,
  ): Promise<APIPaginatedResponseDto<LeaderboardRewardPolicy[]>> {
    return this.leaderboardPolicyService.getPolicies(query);
  }
}
