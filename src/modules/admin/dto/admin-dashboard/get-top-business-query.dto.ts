import { IsOptional, IsInt, IsIn, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class GetTopBusinessesQueryDto {
  @ApiPropertyOptional({
    description: 'Get top N businesses',
    example: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  top?: number = 0;

  @ApiPropertyOptional({
    enum: ['co2Reduced', 'ecoPoints', 'averageRating'],
    description: 'Sort by field',
    example: 'co2Reduced',
  })
  @IsOptional()
  @IsIn(['co2Reduced', 'ecoPoints', 'averageRating'])
  sortBy?: 'co2Reduced' | 'ecoPoints' | 'averageRating' = 'co2Reduced';

  @ApiPropertyOptional({
    enum: ['asc', 'desc'],
    example: 'desc',
  })
  @IsOptional()
  @IsIn(['asc', 'desc'])
  order?: 'asc' | 'desc' = 'desc';
}
