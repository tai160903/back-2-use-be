import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BorrowTransactionDocument = HydratedDocument<BorrowTransaction>;

@Schema({ timestamps: true })
export class BorrowTransaction {
  @Prop({ required: true, ref: 'Customers', type: Types.ObjectId })
  customerId: Types.ObjectId;

  @Prop({ required: true, ref: 'Product', type: Types.ObjectId })
  productId: Types.ObjectId;

  @Prop({ required: true, ref: 'Businesses', type: Types.ObjectId })
  businessId: Types.ObjectId;

  @Prop({ enum: ['borrow', 'return_success', 'return_failed'], required: true })
  borrowTransactionType: string;

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

  @Prop({ type: Number, default: 0 })
  extensionCount?: number;

  @Prop({ type: Date })
  lastExtensionDate?: Date;
  @Prop()
  rewardPointChanged?: number;

  @Prop()
  rankingPointChanged?: number;

  @Prop()
  ecoPointChanged?: number;

  @Prop()
  co2Changed?: number;

  @Prop({ default: false })
  isLateProcessed: boolean;
}

export const BorrowTransactionSchema =
  SchemaFactory.createForClass(BorrowTransaction);
