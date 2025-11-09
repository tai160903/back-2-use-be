import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BorrowTransactionDocument = HydratedDocument<BorrowTransaction>;

@Schema({ timestamps: true })
export class BorrowTransaction {
  @Prop({ required: true, ref: 'Customers', type: Types.ObjectId })
  customerId: Types.ObjectId;

  @Prop({ required: true, ref: 'Products', type: Types.ObjectId })
  productId: Types.ObjectId;

  @Prop({ required: true, ref: 'Businesses', type: Types.ObjectId })
  businessId: Types.ObjectId;

  @Prop({ required: true })
  borrowDate: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop()
  returnDate: Date;

  @Prop({ required: true })
  depositAmount: number;

  @Prop({
    enum: [
      'pending_pickup',
      'borrowing',
      'returned',
      'return_late',
      'rejected',
      'lost',
      'canceled',
    ],
  })
  status: string;
  @Prop()
  qrCode: string;
}

export const BorrowTransactionSchema =
  SchemaFactory.createForClass(BorrowTransaction);
