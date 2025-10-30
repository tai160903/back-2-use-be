import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsEnum, IsInt, Min } from 'class-validator';
import { VoucherCodeStatus } from 'src/common/constants/voucher-codes-status.enum';

export class GetVoucherCodesQueryDto {
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
