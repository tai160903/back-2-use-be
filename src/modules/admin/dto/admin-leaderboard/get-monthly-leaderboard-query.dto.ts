import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min, Max } from 'class-validator';

export class GetMonthlyLeaderboardQueryDto {
  @ApiPropertyOptional({
    description: 'Filter leaderboard by month (1–12)',
    // example: 11,
  })
  @Type(() => Number)
  @IsOptional()
  month?: number;

  @ApiPropertyOptional({
    description: 'Filter leaderboard by year',
    // example: 2025,
  })
  @Type(() => Number)
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({
    description: 'Minimum rank to filter',
    // example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  rankMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum rank to filter',
    // example: 100,
  })
  @Type(() => Number)
  @IsOptional()
  rankMax?: number;

  @ApiPropertyOptional({
    description: 'Minimum ranking points',
    // example: 500,
  })
  @Type(() => Number)
  @IsOptional()
  minPoints?: number;

  @ApiPropertyOptional({
    description: 'Maximum ranking points',
    // example: 2000,
  })
  @Type(() => Number)
  @IsOptional()
  maxPoints?: number;

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
