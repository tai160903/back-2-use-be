import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsEnum, IsNumber, IsOptional, Min, IsBoolean } from 'class-validator';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';

export class GetBusinessVoucherByVoucherIdQueryDto {
  @ApiPropertyOptional({
    example: VouchersStatus.ACTIVE,
    description: 'Filter by voucher status',
    enum: VouchersStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(VouchersStatus)
  status?: VouchersStatus;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  isPublished?: boolean;

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
