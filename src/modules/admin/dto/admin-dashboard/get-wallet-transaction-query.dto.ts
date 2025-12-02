import { IsOptional, IsEnum, IsNumberString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType } from 'src/common/constants/transaction-type.enum';
import { WalletDirection } from 'src/common/constants/wallet-direction.enum';
import { WalletTransactionStatus } from 'src/common/constants/wallet-transaction-status.enum';

export class GetWalletByMonthDto {
  @ApiPropertyOptional({ example: 2025 })
  @IsOptional()
  @IsNumberString()
  year?: number;

  @ApiPropertyOptional({
    enum: TransactionType,
    description: 'Filter by transaction type',
  })
  @IsOptional()
  @IsEnum(TransactionType)
  transactionType?: TransactionType;

  @ApiPropertyOptional({
    enum: WalletDirection,
    description: 'Filter by direction',
  })
  @IsOptional()
  @IsEnum(WalletDirection)
  direction?: WalletDirection;

  @ApiPropertyOptional({
    enum: WalletTransactionStatus,
    description: 'Filter by status',
  })
  @IsOptional()
  @IsEnum(WalletTransactionStatus)
  status?: WalletTransactionStatus;
}
