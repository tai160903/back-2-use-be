import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsMongoId,
  IsString,
} from 'class-validator';

export class UpdateLeaderboardRewardPolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsMongoId()
  voucherId?: string;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  rankFrom?: number;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  rankTo?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}
