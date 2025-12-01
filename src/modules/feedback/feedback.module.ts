import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { FeedbackService } from './feedback.service';
import { FeedbackController } from './feedback.controller';
import { Feedback, FeedbackSchema } from './schemas/feedback.schema';
import {
  BorrowTransaction,
  BorrowTransactionSchema,
} from '../borrow-transactions/schemas/borrow-transactions.schema';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import { Customers, CustomersSchema } from '../users/schemas/customer.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Feedback.name, schema: FeedbackSchema },
      { name: BorrowTransaction.name, schema: BorrowTransactionSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: Customers.name, schema: CustomersSchema },
    ]),
  ],
  controllers: [FeedbackController],
  providers: [FeedbackService],
  exports: [FeedbackService],
})
export class FeedbackModule {}
