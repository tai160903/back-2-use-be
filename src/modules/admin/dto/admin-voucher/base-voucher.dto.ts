// src/modules/admin/dto/base-voucher.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString, IsEnum } from 'class-validator';
import { VoucherType } from 'src/common/constants/voucher-types.enum';

export class BaseVoucherDto {
  @ApiPropertyOptional({
    example: '2025-12-01T00:00:00Z',
    description: 'Start date of voucher validity',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-01-01T00:00:00Z',
    description: 'End date of voucher validity',
    type: 'string',
    format: 'date-time',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @IsEnum(VoucherType)
  voucherType: VoucherType;
}
