import { OmitType } from '@nestjs/swagger';
import { BaseVoucherDto } from '../base-voucher.dto';
import {
  ApiProperty,
  ApiPropertyOptional,
  ApiHideProperty,
} from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Min,
  IsEnum,
  IsBoolean,
} from 'class-validator';
import { VoucherType } from 'src/common/constants/voucher-types.enum';

export class CreateBusinessVoucherDto extends OmitType(BaseVoucherDto, [
  'startDate',
  'endDate',
] as const) {
  @ApiProperty({ example: 'Business Voucher', description: 'Voucher name' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    example: 'Voucher template created by admin',
    description: 'Voucher description',
  })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 'BIZ2025',
    description: 'Base voucher code (prefix for generated codes)',
  })
  @IsString()
  @IsNotEmpty()
  baseCode: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Maximum number of redemptions allowed (default = 1)',
  })
  @IsNumber()
  @Min(1)
  maxUsage: number;

  @ApiPropertyOptional({
    example: '673b3f0d1f1f5f55f8f87c22',
    description: 'EcoRewardPolicy ID',
  })
  @IsString()
  ecoRewardPolicyId: string;

  @ApiProperty()
  @IsBoolean()
  isDisabled: boolean;

  @ApiHideProperty()
  @IsEnum(VoucherType)
  voucherType: VoucherType = VoucherType.BUSINESS;
}
