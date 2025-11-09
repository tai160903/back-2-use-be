import {
  ApiHideProperty,
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
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
} from 'class-validator';
import { VoucherType } from 'src/common/constants/voucher-types.enum';
import { BaseVoucherDto } from '../base-voucher.dto';

export class CreateLeaderboardVoucherDto extends OmitType(BaseVoucherDto, [
  'startDate',
  'endDate',
] as const) {
  @ApiProperty({
    example: 'Leaderboard Reward 2025',
    description: 'Voucher name',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'Given to top leaderboard users',
    description: 'Voucher description',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 30, description: 'Discount percentage (1–100)' })
  @IsNumber()
  @Min(1)
  @Max(100)
  discountPercent: number;

  @ApiProperty({
    example: 'LEAD2025',
    description: 'Base voucher code (prefix for generated codes)',
  })
  @IsString()
  @IsNotEmpty()
  baseCode: string;

  @ApiHideProperty()
  @IsEnum(VoucherType)
  voucherType: VoucherType = VoucherType.LEADERBOARD;
}
