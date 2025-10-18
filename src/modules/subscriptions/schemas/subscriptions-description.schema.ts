import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubscriptionFeaturesDocument =
  HydratedDocument<SubscriptionFeatures>;

@Schema({ timestamps: true })
export class SubscriptionFeatures {
  @Prop({ required: true })
  features: string[];
}

export const SubscriptionFeaturesSchema =
  SchemaFactory.createForClass(SubscriptionFeatures);
