// dto/create-business-voucher.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsBoolean,
  IsDateString,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

export class BusinessCreateVoucherDto {
  @ApiProperty({
    description: 'Custom display name of the voucher set by the business.',
    example: '20% Discount on All Products',
  })
  @IsString()
  customName: string;

  @ApiProperty({
    description: 'Detailed description of the voucher.',
    example: 'Applicable for all orders from 200,000 VND.',
  })
  @IsString()
  customDescription: string;

  @ApiProperty({
    description:
      'Base code used to generate unique voucher codes for customers.',
    example: 'SHOP20',
  })
  @IsString()
  baseCode: string;

  @ApiProperty({
    description: 'Maximum number of usages allowed for this voucher.',
    example: 100,
  })
  @IsNumber()
  maxUsage: number;

  @ApiProperty({
    description: 'Discount percentage applied by this voucher.',
    example: 20,
  })
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent: number;

  @ApiProperty({
    description:
      'Number of reward points required for customers to redeem this voucher.',
    example: 150,
  })
  @IsNumber()
  @Min(0)
  rewardPointCost: number;

  @ApiPropertyOptional({
    description: 'Start date of the voucher validity period (ISO format).',
    example: '2025-11-29T04:35:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: Date;

  @ApiProperty({
    description: 'End date of the voucher validity period (ISO format).',
    example: '2025-12-29T04:35:00.000Z',
  })
  @IsDateString()
  endDate?: Date;

  @ApiProperty({
    required: false,
    description:
      'Whether the voucher should be published immediately. Default = true.',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean = true;
}
