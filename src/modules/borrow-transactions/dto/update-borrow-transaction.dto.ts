import { PartialType } from '@nestjs/swagger';
import { CreateBorrowTransactionDto } from './create-borrow-transaction.dto';

export class UpdateBorrowTransactionDto extends PartialType(CreateBorrowTransactionDto) {}
