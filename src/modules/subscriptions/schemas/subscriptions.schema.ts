import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ timestamps: true })
export class Subscription {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string[];

  @Prop({ required: true })
  price: number;

  @Prop({ required: true })
  durationInDays: number;

  @Prop({ required: true })
  isActive: boolean;

  @Prop({ required: true })
  isTrial: boolean;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);
