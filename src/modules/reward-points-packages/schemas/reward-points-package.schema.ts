import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RewardPointsPackageDocument = HydratedDocument<RewardPointsPackage>;

@Schema({ timestamps: true })
export class RewardPointsPackage {
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, min: 0 })
  points: number;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ required: false, trim: true })
  description: string;

  @Prop({ required: true, default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const RewardPointsPackageSchema =
  SchemaFactory.createForClass(RewardPointsPackage);
