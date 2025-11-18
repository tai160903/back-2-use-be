import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  Min,
  Max,
  IsMongoId,
  IsOptional,
} from 'class-validator';

export class CreateLeaderboardRewardPolicyDto {
  @ApiProperty({
    description: 'Voucher template ID used as reward',
    example: '67a12c2f1c3f8218d4d91aa3',
  })
  @IsMongoId()
  @IsNotEmpty()
  voucherId: string;

  @ApiProperty({
    description: 'Month this policy applies to (1–12)',
    example: 11,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({
    description: 'Year this policy applies to',
    example: 2025,
  })
  @Type(() => Number)
  @IsInt()
  year: number;

  @ApiProperty({
    description: 'Starting rank for this reward range',
    example: 1,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rankFrom: number;

  @ApiProperty({
    description: 'Ending rank for this reward range',
    example: 3,
  })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  rankTo: number;

  @ApiPropertyOptional({
    description: 'Optional notes or description for this policy',
    example: 'Reward for top 3 leaderboard users',
  })
  @IsOptional()
  note?: string;
}
