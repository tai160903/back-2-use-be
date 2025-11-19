import { PartialType } from '@nestjs/swagger';
import { AdminCreateRewardSettingDto } from './create-reward-setting.dto';

export class AdminUpdateRewardSettingDto extends PartialType(
  AdminCreateRewardSettingDto,
) {}
