import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubscriptionsDocument = HydratedDocument<Subscriptions>;

@Schema({ timestamps: true })
export class Subscriptions {
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

export const SubscriptionsSchema = SchemaFactory.createForClass(Subscriptions);
