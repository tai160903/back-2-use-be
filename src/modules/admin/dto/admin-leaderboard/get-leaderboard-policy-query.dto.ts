import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min } from 'class-validator';

export class GetLeaderboardRewardPolicyQueryDto {
  @ApiPropertyOptional({
    description: 'Filter policies by month (1–12)',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  month?: number;

  @ApiPropertyOptional({
    description: 'Filter policies by year',
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  year?: number;

  @ApiPropertyOptional({
    description: 'Filter by minimum starting rank',
    // example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  rankFrom?: number;

  @ApiPropertyOptional({
    description: 'Filter by maximum ending rank',
    // example: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  rankTo?: number;

  @ApiPropertyOptional({
    description: 'Page number for pagination (default: 1)',
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (default: 10)',
    example: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @Min(1)
  limit?: number = 10;
}
