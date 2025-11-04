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

  @Prop()
  startDate: Date;

  @Prop()
  endDate: Date;

  @Prop({ required: true, default: false })
  isActive: boolean;

  @Prop({ required: true, default: false })
  isTrialUsed: boolean;

  @Prop({ default: false })
  isExpiringNotified: boolean;

  @Prop()
  expiringNotifiedAt: Date;

  @Prop({ default: false })
  autoRenew: boolean;

  @Prop({ required: false })
  lastAutoRenewalAt?: Date;

  @Prop({ required: false })
  autoRenewalFailedAt?: Date;

  @Prop({ required: false })
  autoRenewalFailureReason?: string;
}

export const BusinessSubscriptionsSchema = SchemaFactory.createForClass(
  BusinessSubscriptions,
);
