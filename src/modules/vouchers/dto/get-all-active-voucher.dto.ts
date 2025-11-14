import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsInt, Min, IsEnum } from 'class-validator';

export enum CustomerVoucherFilterStatus {
  INACTIVE = 'inactive',
  ACTIVE = 'active',
  EXPIRED = 'expired',
}

export class GetAllVouchersQueryDto {
  @ApiPropertyOptional({
    enum: CustomerVoucherFilterStatus,
    example: CustomerVoucherFilterStatus.ACTIVE,
    description: 'Filter by voucher status (inactive, active, expired)',
  })
  @IsOptional()
  @IsEnum(CustomerVoucherFilterStatus)
  status?: CustomerVoucherFilterStatus;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
