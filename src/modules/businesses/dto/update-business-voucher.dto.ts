// dto/update-business-voucher.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsNumber,
  Min,
  Max,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class UpdateBusinessVoucherDto {
  @ApiPropertyOptional({ description: 'Custom name of the voucher' })
  @IsOptional()
  @IsString()
  customName?: string;

  @ApiPropertyOptional({ description: 'Custom description of the voucher' })
  @IsOptional()
  @IsString()
  customDescription?: string;

  @ApiPropertyOptional({
    description: 'Discount percentage (0 - 100)',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  @ApiPropertyOptional({
    description: 'Reward point cost to redeem the voucher',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  rewardPointCost?: number;

  @ApiPropertyOptional({
    description: 'Voucher start date (ISO 8601)',
    example: '2025-12-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Voucher end date (ISO 8601)',
    example: '2025-12-31T23:59:59.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Whether this voucher is visible to customers',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublished?: boolean;
}
