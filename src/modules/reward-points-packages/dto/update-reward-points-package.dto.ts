import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsNumber, IsString, Min } from 'class-validator';

export class UpdateRewardPointsPackageDto {
  @ApiPropertyOptional({
    description: 'Package name',
    example: 'Gold Package',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Number of reward points',
    example: 200,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  points?: number;

  @ApiPropertyOptional({
    description: 'Package price',
    example: 100000,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'Package description',
    example: 'Get 200 reward points',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Is package active',
    example: true,
  })
  @IsOptional()
  isActive?: boolean;
}
