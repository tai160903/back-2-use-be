import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import { IsOptional, IsEnum, IsInt, Min, IsBoolean } from 'class-validator';
import { VoucherType } from 'src/common/constants/voucher-types.enum';

export class GetAllVouchersQueryDto {
  @ApiPropertyOptional({
    enum: VoucherType,
    description: 'Filter by voucher type (business, leaderboard)',
  })
  @IsOptional()
  @IsEnum(VoucherType)
  voucherType?: VoucherType;

  @ApiPropertyOptional({
    example: true,
    description:
      'Filter by disabled status (true or false) use for business voucher',
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  isDisabled?: boolean;

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
