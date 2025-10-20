import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum TransactionDirection {
  IN = 'in',
  OUT = 'out',
}

export enum TransactionFilterGroup {
  PERSONAL = 'personal',
  DEPOSIT_REFUND = 'deposit_refund',
}

export class GetWalletTransactionsQueryDto {
  @ApiPropertyOptional({
    enum: TransactionFilterGroup,
    description:
      'Filter by transaction group: "personal" (deposit, withdraw, subscription_fee) or "deposit_refund" (borrow_deposit, return_refund)',
    example: 'personal',
  })
  @IsOptional()
  @IsEnum(TransactionFilterGroup)
  typeGroup?: TransactionFilterGroup;

  @ApiPropertyOptional({
    enum: TransactionDirection,
    description:
      'Filter by transaction direction (in = money in, out = money out)',
    example: 'in',
  })
  @IsOptional()
  @IsEnum(TransactionDirection)
  direction?: TransactionDirection;

  @ApiPropertyOptional({ example: 1, description: 'Page number' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, description: 'Items per page' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
