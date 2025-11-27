import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum BorrowTransactionStatus {
  PENDING_PICKUP = 'pending_pickup',
  BORROWING = 'borrowing',
  RETURNED = 'returned',
  RETURN_LATE = 'return_late',
  REJECTED = 'rejected',
  LOST = 'lost',
  CANCELED = 'canceled',
}

export enum BorrowTransactionType {
  BORROW = 'borrow',
  RETURN_SUCCESS = 'return_success',
  RETURN_FAILED = 'return_failed',
}

export class GetTransactionsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  productName?: string;

  @ApiPropertyOptional({ example: 'ABC123' })
  @IsOptional()
  @IsString()
  serialNumber?: string;

  @ApiPropertyOptional({
    enum: BorrowTransactionStatus,
    description: 'Filter by transaction status',
  })
  @IsOptional()
  @IsEnum(BorrowTransactionStatus)
  status?: BorrowTransactionStatus;

  @ApiPropertyOptional({
    enum: BorrowTransactionType,
    description: 'Borrow transaction type',
  })
  @IsOptional()
  @IsEnum(BorrowTransactionType)
  borrowTransactionType?: BorrowTransactionType;

  @ApiPropertyOptional({ example: 1 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number;
}
