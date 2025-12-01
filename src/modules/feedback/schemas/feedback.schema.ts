import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type FeedbackDocument = HydratedDocument<Feedback>;

@Schema({ timestamps: true })
export class Feedback {
  @Prop({ required: true, ref: 'Customers', type: Types.ObjectId })
  customerId: Types.ObjectId;

  @Prop({ required: true, ref: 'Businesses', type: Types.ObjectId })
  businessId: Types.ObjectId;

  @Prop({ required: true, ref: 'BorrowTransaction', type: Types.ObjectId })
  borrowTransactionId: Types.ObjectId;

  @Prop({ required: true, ref: 'Product', type: Types.ObjectId })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ trim: true, maxlength: 500 })
  comment?: string;

  @Prop({ default: false })
  isEdited: boolean;
}

export const FeedbackSchema = SchemaFactory.createForClass(Feedback);
