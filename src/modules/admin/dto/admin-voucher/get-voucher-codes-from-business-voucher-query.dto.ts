import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';
import { VoucherCodeStatus } from 'src/common/constants/voucher-codes-status.enum';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';

export class GetVoucherCodesByBusinessVoucherIdQueryDto {
  @ApiPropertyOptional({
    enum: VoucherCodeStatus,
    description: 'Filter voucher codes by status',
    example: VoucherCodeStatus.REDEEMED,
  })
  @IsOptional()
  @IsEnum(VoucherCodeStatus)
  status?: VoucherCodeStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
    default: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
    default: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
