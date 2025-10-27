import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class CreateVoucherDto {
  @ApiProperty({ example: 'Summer Sale 2025' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Get 20% off all products this summer!' })
  @IsString()
  description: string;

  @ApiProperty({ example: 20, description: 'Discount percentage (1-100)' })
  @IsNumber()
  @Min(1)
  @Max(100)
  discount: number;

  @ApiProperty({ example: 'SUMMER2025' })
  @IsString()
  @IsNotEmpty()
  baseCode: string;

  @ApiProperty({ example: 50, description: 'Reward points required to redeem' })
  @IsNumber()
  @Min(0)
  rewardPointCost: number;

  @ApiProperty({
    example: 100,
    description: 'Maximum number of redemptions allowed',
  })
  @IsNumber()
  @Min(1)
  maxUsage: number;

  @ApiProperty({ example: '2025-08-31T23:59:59Z' })
  @IsDateString()
  endDate: Date;
}
