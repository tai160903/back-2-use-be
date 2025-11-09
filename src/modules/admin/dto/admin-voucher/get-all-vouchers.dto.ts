import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';
import { VoucherType } from 'src/common/constants/voucher-types.enum';

export class GetAllVouchersQueryDto {
  @ApiPropertyOptional({
    enum: VoucherType,
    description: 'Filter by voucher type (system, business, leaderboard)',
  })
  @IsOptional()
  @IsEnum(VoucherType)
  voucherType?: VoucherType;

  @ApiPropertyOptional({
    enum: VouchersStatus,
    description: 'Filter by voucher status',
  })
  @IsOptional()
  @IsEnum(VouchersStatus)
  status?: VouchersStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit: number = 10;
}
