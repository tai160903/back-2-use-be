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
  PENALTY = 'penalty',
}

export enum WalletType {
  CUSTOMER = 'customer',
  BUSINESS = 'business',
}

export class GetWalletTransactionsQueryDto {
  @ApiPropertyOptional({
    enum: WalletType,
    description: 'Filter by wallet type (customer or business)',
    example: 'customer',
  })
  @IsOptional()
  @IsEnum(WalletType)
  walletType?: WalletType;

  @ApiPropertyOptional({
    enum: TransactionFilterGroup,
    description:
      'Group: personal (top_up, withdraw, subscription_fee), deposit_refund (borrow_deposit, return_refund), penalty',
    example: 'personal',
  })
  @IsOptional()
  @IsEnum(TransactionFilterGroup)
  typeGroup?: TransactionFilterGroup;

  @ApiPropertyOptional({
    enum: TransactionDirection,
    description: 'Transaction direction (in = money in, out = money out)',
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
