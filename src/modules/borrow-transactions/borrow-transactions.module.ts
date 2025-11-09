import { Module } from '@nestjs/common';
import { BorrowTransactionsService } from './borrow-transactions.service';
import { BorrowTransactionsController } from './borrow-transactions.controller';

@Module({
  controllers: [BorrowTransactionsController],
  providers: [BorrowTransactionsService],
})
export class BorrowTransactionsModule {}
