import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BusinessSubscriptionsDocument =
  HydratedDocument<BusinessSubscriptions>;

@Schema({ timestamps: true })
export class BusinessSubscriptions {
  @Prop({ required: true, ref: 'Businesses' })
  businessId: Types.ObjectId;

  @Prop({ required: true, ref: 'Subscriptions' })
  subscriptionId: Types.ObjectId;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({ required: true })
  isActive: boolean;

  @Prop({ required: true, default: false })
  isTrialUsed: boolean;
}

export const BusinessSubscriptionsSchema = SchemaFactory.createForClass(
  BusinessSubscriptions,
);
