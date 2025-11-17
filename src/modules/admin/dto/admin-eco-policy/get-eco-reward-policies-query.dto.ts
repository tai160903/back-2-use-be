// src/modules/eco-reward-policies/dto/admin-eco-policy/get-eco-reward-policies-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsInt, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class GetEcoRewardPoliciesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by policy active status (true/false)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination (default: 1)',
    example: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (default: 10)',
    example: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
