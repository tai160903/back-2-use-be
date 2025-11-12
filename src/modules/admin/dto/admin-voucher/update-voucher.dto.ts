import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsNumber,
  IsDateString,
  Max,
  Min,
} from 'class-validator';

export class UpdateVoucherDto {
  // 🏷️ Dùng cho SYSTEM (INACTIVE) hoặc BUSINESS (đôi khi cho chỉnh name/desc)
  @ApiPropertyOptional({
    description: 'Voucher name (only editable for SYSTEM inactive vouchers)',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description:
      'Voucher description (only editable for SYSTEM inactive vouchers)',
  })
  @IsOptional()
  @IsString()
  description?: string;

  // 💰 Dùng cho SYSTEM (inactive) khi điều chỉnh khuyến mãi
  @ApiPropertyOptional({
    description:
      'Discount percentage (only editable for SYSTEM inactive vouchers)',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  discountPercent?: number;

  // 🎟️ Dùng cho SYSTEM (inactive)
  @ApiPropertyOptional({
    description:
      'Base code for the voucher (only editable for SYSTEM inactive vouchers)',
    example: 'SUMMER2025',
  })
  @IsOptional()
  @IsString()
  baseCode?: string;

  // 🎯 Dùng cho SYSTEM (inactive)
  @ApiPropertyOptional({
    description:
      'Reward point cost (only editable for SYSTEM inactive vouchers)',
    example: 200,
  })
  @IsOptional()
  @IsNumber()
  rewardPointCost?: number;

  // 🧾 Dùng cho SYSTEM (inactive)
  @ApiPropertyOptional({
    description:
      'Maximum usage limit (only editable for SYSTEM inactive vouchers)',
    example: 100,
  })
  @IsOptional()
  @IsNumber()
  maxUsage?: number;

  // ⏰ Dùng cho SYSTEM (inactive)
  @ApiPropertyOptional({
    description: 'Start date (only editable for SYSTEM inactive vouchers)',
    example: '2025-12-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date (only editable for SYSTEM inactive vouchers)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  // 🚫 Dùng cho mọi loại voucher để bật/tắt
  @ApiPropertyOptional({
    description: 'Disable voucher (applicable for all types)',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isDisabled?: boolean;
}
