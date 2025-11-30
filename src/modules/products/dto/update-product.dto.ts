import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ProductCondition } from 'src/common/constants/product-condition.enum';
import { ProductStatus } from 'src/common/constants/product-status.enum';

export class UpdateProductDto {
  @ApiProperty({
    description: 'Product status',
    enum: ProductStatus,
    example: 'available',
    required: false,
  })
  @IsOptional()
  @IsEnum(ProductStatus, {
    message: 'Status must be either available or non-available',
  })
  status?: string;

  @ApiProperty({
    description: 'Last condition note',
    example: 'Good condition, no damage',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastConditionNote?: string;

  @ApiProperty({
    description: 'Last condition image URL',
    example: 'https://cloudinary.com/image.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  lastConditionImage?: string;

  @ApiProperty({
    description: 'Product condition',
    required: false,
    enum: ProductCondition,
    example: 'good',
  })
  @IsOptional()
  @IsEnum(ProductCondition, {
    message: 'Condition must be one of good, damaged, expired, lost',
  })
  condition?: string;
}
