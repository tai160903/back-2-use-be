import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BusinessSubscriptionsDocument =
  HydratedDocument<BusinessSubscriptions>;

@Schema({ timestamps: true })
export class BusinessSubscriptions {
  @Prop({ required: true, ref: 'Businesses' })
  businessId: string;

  @Prop({ required: true, ref: 'Subscriptions' })
  subscriptionId: string;

  @Prop({ required: true })
  startDate: Date;

  @Prop({ required: true })
  endDate: Date;

  @Prop({})
  isActive: boolean;

  @Prop({ required: true })
  isTrialUsed: boolean;
}

export const BusinessSubscriptionsSchema = SchemaFactory.createForClass(
  BusinessSubscriptions,
);
