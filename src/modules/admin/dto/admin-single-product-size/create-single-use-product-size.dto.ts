// dto/admin-create-single-use-product-size.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import {
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';

export class AdminCreateSingleUseProductSizeDto {
  @ApiProperty({
    description: 'Product type ID (cup / container / bottle)',
  })
  @IsMongoId()
  productTypeId: string;

  @ApiProperty({
    example: 'M',
    description: 'Size name (S, M, L, 12oz, 16oz...)',
  })
  @IsString()
  @IsNotEmpty()
  sizeName: string;

  @ApiProperty({
    example: 12,
    description: 'Min weight (gram)',
  })
  @IsNumber()
  @Min(0)
  minWeight: number;

  @ApiProperty({
    example: 18,
    description: 'Max weight (gram)',
  })
  @IsNumber()
  @Min(0)
  maxWeight: number;
}
