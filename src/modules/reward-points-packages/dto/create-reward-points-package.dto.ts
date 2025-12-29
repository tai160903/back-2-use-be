import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  Min,
} from 'class-validator';

export class CreateRewardPointsPackageDto {
  @ApiProperty({
    description: 'Package name',
    example: 'Bronze Package',
  })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Number of reward points',
    example: 100,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  points: number;

  @ApiProperty({
    description: 'Package price',
    example: 50000,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({
    description: 'Package description',
    example: 'Get 100 reward points',
  })
  @IsOptional()
  @IsString()
  description?: string;
}
