import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, Max, Min } from 'class-validator';
import { Types } from 'mongoose';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product Size ID',
    example: '67305e0a8a2a4b228c2f1a11',
    type: String,
  })
  @IsNotEmpty({ message: 'Product Size ID is required' })
  productSizeId: Types.ObjectId;

  @ApiProperty({
    description: 'Product Group ID',
    example: '67305e0a8a2a4b228c2f1a12',
    type: String,
  })
  @IsNotEmpty({ message: 'Product Group ID is required' })
  productGroupId: Types.ObjectId;

  @ApiProperty({
    description: 'Number of products to create (1-1000)',
    example: 10,
    minimum: 1,
    maximum: 1000,
    type: Number,
  })
  @IsNumber({}, { message: 'Amount must be a number' })
  @IsPositive({ message: 'Amount must be a positive number' })
  @Min(1, { message: 'Amount must be at least 1' })
  @Max(1000, { message: 'Amount must not exceed 1000' })
  amount: number;

  @ApiProperty({
    description: 'Initial condition for created products',
    required: false,
    enum: ['good', 'damaged', 'expired', 'lost'],
    example: 'good',
  })
  condition?: string;
}
