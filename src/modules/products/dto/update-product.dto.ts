import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateProductDto {
  @ApiProperty({
    description: 'Product status',
    enum: ['available', 'non-available'],
    example: 'available',
    required: false,
  })
  @IsOptional()
  @IsEnum(['available', 'non-available'], {
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
    enum: ['good', 'damaged', 'expired', 'lost'],
    example: 'good',
  })
  @IsOptional()
  @IsEnum(['good', 'damaged', 'expired', 'lost'], {
    message: 'Condition must be one of good, damaged, expired, lost',
  })
  condition?: string;
}
