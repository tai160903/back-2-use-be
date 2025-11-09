import { PartialType } from '@nestjs/swagger';
import { CreateEcoRewardPolicyDto } from './create-eco-reward-policy.dto';

export class UpdateEcoRewardPolicyDto extends PartialType(
  CreateEcoRewardPolicyDto,
) {}
