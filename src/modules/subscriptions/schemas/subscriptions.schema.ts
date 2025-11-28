import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SubscriptionsDocument = HydratedDocument<Subscriptions>;

export enum ExportLevel {
  NONE = 'none',
  BASIC = 'basic',
  ADVANCED = 'advanced',
}

@Schema({ timestamps: true })
export class Limits {
  @Prop({ required: true })
  productGroupLimit: number; // -1 = unlimited

  @Prop({ required: true })
  productItemLimit: number; // -1 = unlimited

  @Prop({ required: true, enum: Object.values(ExportLevel) })
  exportLevel: ExportLevel;

  @Prop({ required: true })
  ecoBonusPercent: number;
}

export const LimitsSchema = SchemaFactory.createForClass(Limits);

@Schema({ timestamps: true })
export class Subscriptions {
  @Prop({ required: true, trim: true, index: true })
  name: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: true, min: 0 })
  durationInDays: number;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ required: true, default: false })
  isTrial: boolean;

  @Prop({ type: LimitsSchema, required: true })
  limits: Limits;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const SubscriptionsSchema = SchemaFactory.createForClass(Subscriptions);
