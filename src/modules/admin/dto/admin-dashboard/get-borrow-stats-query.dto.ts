import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNumberString, IsOptional } from 'class-validator';
import { BorrowTransactionStatus } from 'src/common/constants/borrow-transaction-status.enum';
import { BorrowTransactionType } from 'src/common/constants/borrow-transaction-type.enum';

export class GetBorrowStatsByMonthDto {
  @ApiPropertyOptional({ example: 2025, description: 'Year to filter' })
  @IsOptional()
  @IsNumberString()
  year?: number;

  @ApiPropertyOptional({
    enum: BorrowTransactionType,
    description: 'Filter by borrow transaction type',
  })
  @IsOptional()
  @IsEnum(BorrowTransactionType)
  type?: BorrowTransactionType;

  @ApiPropertyOptional({
    enum: BorrowTransactionStatus,
    description: 'Filter by borrow transaction status',
  })
  @IsOptional()
  @IsEnum(BorrowTransactionStatus)
  status?: BorrowTransactionStatus;
}
