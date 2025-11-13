// src/modules/vouchers/dto/create-system-voucher.dto.ts
import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
} from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { VoucherType } from 'src/common/constants/voucher-types.enum';
import { BaseVoucherDto } from '../base-voucher.dto';

export class CreateSystemVoucherDto extends BaseVoucherDto {
  @ApiProperty({ example: 'System Voucher 2025', description: 'Voucher name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Special discount from system',
    description: 'Voucher description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 10, description: 'Discount percentage (1–100)' })
  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercent: number;

  @ApiProperty({
    example: 'SYS2025',
    description: 'Base voucher code (prefix for generated codes)',
  })
  @IsString()
  @IsNotEmpty()
  baseCode: string;

  @ApiProperty({
    example: 50,
    description: 'Reward points required to redeem this voucher',
  })
  @IsNumber()
  @Min(0)
  rewardPointCost: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Maximum number of redemptions allowed (default = 1)',
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  maxUsage?: number;

  @ApiHideProperty()
  @IsBoolean()
  isPublished: boolean = true;

  @ApiHideProperty()
  @IsEnum(VoucherType)
  voucherType: VoucherType = VoucherType.SYSTEM;
}
