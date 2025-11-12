// dto/get-vouchers-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum VoucherTypeFilter {
  SYSTEM = 'system',
  BUSINESS = 'business',
}

export class GetVouchersQueryDto {
  @ApiPropertyOptional({
    enum: VoucherTypeFilter,
    description: 'Loại voucher cần lấy (system hoặc business)',
  })
  @IsOptional()
  @IsEnum(VoucherTypeFilter)
  voucherType?: VoucherTypeFilter;

  @ApiPropertyOptional({
    description:
      'Label tier của ecoRewardPolicy (VD: Bronze, Silver, Gold, Diamond) - chỉ dùng khi voucherType là business',
    example: 'Silver',
  })
  @IsOptional()
  @IsString()
  tierLabel?: string;

  @ApiPropertyOptional({
    description:
      'Ngưỡng điểm tối thiểu để lọc (VD: 500) - chỉ dùng khi voucherType là business',
    example: 500,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minThreshold?: number;

  @ApiPropertyOptional({ description: 'Trang hiện tại', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Số item mỗi trang', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number;
}
