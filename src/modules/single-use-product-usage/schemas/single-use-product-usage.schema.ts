import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SingleUseProductUsageDocument =
  HydratedDocument<SingleUseProductUsage>;

@Schema({ timestamps: true })
export class SingleUseProductUsage {
  @Prop({
    type: Types.ObjectId,
    ref: 'BorrowTransaction',
    required: true,
    index: true,
  })
  borrowTransactionId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Businesses',
    required: true,
    index: true,
  })
  businessId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Customers',
    required: true,
    index: true,
  })
  customerId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SingleUseProduct',
    required: true,
  })
  singleUseProductId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
  })
  co2PerUnit: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'Staff',
  })
  staffId?: Types.ObjectId;

  @Prop()
  note?: string;
}

export const SingleUseProductUsageSchema = SchemaFactory.createForClass(
  SingleUseProductUsage,
);
