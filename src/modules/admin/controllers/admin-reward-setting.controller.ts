import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RolesEnum } from 'src/common/constants/roles.enum';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { RoleCheckGuard } from 'src/common/guards/role-check.guard';
import { AdminRewardSettingService } from '../services/admin-reward-setting.service';
import { AdminCreateRewardSettingDto } from '../dto/admin-reward-setting/create-reward-setting.dto';
import { AdminUpdateRewardSettingDto } from '../dto/admin-reward-setting/update-reward-setting.dto';
import { APIResponseDto } from 'src/common/dtos/api-response.dto';
import { RewardSetting } from 'src/modules/reward-settings/schema/reward-setting.schema';

@ApiTags('Reward Setting (Admin)')
@UseGuards(AuthGuard, RoleCheckGuard.withRoles([RolesEnum.ADMIN]))
@ApiBearerAuth('access-token')
@Controller('admin/reward-setting')
export class AdminRewardSettingController {
  constructor(
    private readonly rewardSettingService: AdminRewardSettingService,
  ) {}

  //   POST admin/reward-setting
  @Post()
  create(
    @Body() dto: AdminCreateRewardSettingDto,
  ): Promise<APIResponseDto<RewardSetting>> {
    return this.rewardSettingService.create(dto);
  }

  //   GET admin/reward-setting
  @Get()
  get(): Promise<APIResponseDto<RewardSetting>> {
    return this.rewardSettingService.getActive();
  }

  //   PATCH admin/reward-setting/:id
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: AdminUpdateRewardSettingDto,
  ): Promise<APIResponseDto<RewardSetting>> {
    return this.rewardSettingService.update(id, dto);
  }

  //   PATCH admin/reward-setting/:id/toggle
  @Patch(':id/toggle')
  toggle(@Param('id') id: string): Promise<APIResponseDto<RewardSetting>> {
    return this.rewardSettingService.toggleActive(id);
  }
}
