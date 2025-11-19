import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class AdminCreateRewardSettingDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  rewardSuccess: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  rewardLate: number;

  @ApiProperty()
  @IsNumber()
  rewardFailed: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  rankingSuccess: number;

  @ApiProperty()
  @IsNumber()
  @Min(0)
  rankingLate: number;

  @ApiProperty()
  @IsNumber()
  rankingFailedPenalty: number;
}
