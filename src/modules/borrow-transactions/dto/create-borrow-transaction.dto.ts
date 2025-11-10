import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsNumber, Min } from 'class-validator';
import { Types } from 'mongoose';

export class CreateBorrowTransactionDto {
  @ApiProperty({
    description: 'ID of the product being borrowed',
    example: '67305e0a8a2a4b228c2f1a13',
  })
  @IsNotEmpty()
  @IsMongoId()
  productId: Types.ObjectId;

  @ApiProperty({
    description: 'ID of the business associated with the transaction',
    example: '67305e0a8a2a4b228c2f1a12',
  })
  @IsNotEmpty()
  @IsMongoId()
  businessId: Types.ObjectId;

  @ApiProperty({
    description: 'Duration of the borrow transaction in days',
    example: 30,
  })
  @IsNotEmpty()
  durationInDays: number;

  @ApiProperty({
    description: 'Deposit value per day for the product',
    example: 10,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  depositValue: number;
  @IsEnum(['at_store', 'online'])
  type: string;
}
