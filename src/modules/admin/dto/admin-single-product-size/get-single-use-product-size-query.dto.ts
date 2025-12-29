// dto/get-single-use-product-size-query.dto.ts
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetSingleUseProductSizeQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by product type',
  })
  @IsOptional()
  @IsMongoId()
  productTypeId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Filter active size',
  })
  @IsOptional()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsBoolean()
  isActive?: boolean;
}
