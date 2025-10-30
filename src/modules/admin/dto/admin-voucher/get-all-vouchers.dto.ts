import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsNumber, Min, IsEnum, IsInt } from 'class-validator';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';

export class GetAllVouchersQueryDto {
  @ApiPropertyOptional({
    enum: VouchersStatus,
    description: 'Filter by status',
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
