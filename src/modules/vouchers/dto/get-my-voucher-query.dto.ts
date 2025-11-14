import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { VoucherCodeStatus } from 'src/common/constants/voucher-codes-status.enum';

export class GetMyVouchersQueryDto {
  @ApiPropertyOptional({
    enum: VoucherCodeStatus,
    example: VoucherCodeStatus.REDEEMED,
    description: 'Filter by voucher status (redeemed, used, expired)',
  })
  @IsOptional()
  @IsEnum(VoucherCodeStatus)
  status?: VoucherCodeStatus;

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
