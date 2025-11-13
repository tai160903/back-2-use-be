// dto/get-vouchers-query.dto.ts
import { ApiPropertyOptional, ApiHideProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { VoucherType } from 'src/common/constants/voucher-types.enum';

export class GetVouchersQueryDto {
  @ApiPropertyOptional({
    description:
      'Tier label of the EcoRewardPolicy (e.g., Bronze, Silver, Gold, Diamond)',
    example: 'Silver',
  })
  @IsOptional()
  @IsString()
  tierLabel?: string;

  @ApiPropertyOptional({
    description:
      'Minimum threshold of Eco Points to filter vouchers (e.g., 500)',
    example: 500,
  })
  @IsOptional()
  @Type(() => Number)
  @Min(0)
  minThreshold?: number;

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
