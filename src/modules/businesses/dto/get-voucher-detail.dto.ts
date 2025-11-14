import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { VoucherCodeStatus } from 'src/common/constants/voucher-codes-status.enum';

export class GetVoucherDetailQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by voucher status (redeemed, used, expired)',
    enum: VoucherCodeStatus,
    example: VoucherCodeStatus.REDEEMED,
  })
  @IsOptional()
  @IsEnum(VoucherCodeStatus)
  status?: VoucherCodeStatus;

  @ApiPropertyOptional({ description: 'Current page number', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ description: 'Number of items per page', example: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  limit?: number;
}
