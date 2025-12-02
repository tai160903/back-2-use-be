import { IsOptional, IsInt, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetTopCustomersQueryDto {
  @ApiPropertyOptional({
    description: 'Get top N customers (override pagination)',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  top?: number = 0;

  @ApiPropertyOptional({
    enum: ['rankingPoints', 'rewardPoints', 'returnRate'],
    description: 'Sort by field',
    example: 'rankingPoints',
  })
  @IsOptional()
  @IsIn(['rankingPoints', 'rewardPoints', 'returnRate'])
  sortBy?: 'rankingPoints' | 'rewardPoints' | 'returnRate';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
