import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsBooleanString,
  IsOptional,
  IsPositive,
  Min,
} from 'class-validator';

export class GetMySingleUseProductQueryDto {
  @ApiPropertyOptional({
    example: 'true',
    description: 'Filter by active status',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number (starts from 1)',
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number = 10;
}
