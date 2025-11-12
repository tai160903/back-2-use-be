// dto/get-vouchers-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsBoolean, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';

export enum BusinessVoucherStatusFilter {
  CLAIMED = VouchersStatus.CLAIMED,
  INACTIVE = VouchersStatus.INACTIVE,
  ACTIVE = VouchersStatus.ACTIVE,
  EXPIRED = VouchersStatus.EXPIRED,
}

export class GetAllClaimVouchersQueryDto {
  @ApiPropertyOptional({
    description:
      'Filter by voucher status (claimed, inactive, active, expired)',
    enum: BusinessVoucherStatusFilter,
    example: BusinessVoucherStatusFilter.CLAIMED,
  })
  @IsOptional()
  @IsEnum(BusinessVoucherStatusFilter)
  status?: BusinessVoucherStatusFilter;

//   @ApiPropertyOptional({
//     description:
//       'Filter by setup state (true = already setup, false = not yet setup)',
//     example: true,
//   })
//   @IsOptional()
//   @IsBoolean()
//   @Transform(({ value }) =>
//     value === 'true' ? true : value === 'false' ? false : undefined,
//   )
//   isSetup?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by publish state (true = published, false = hidden)',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  isPublished?: boolean;

  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
