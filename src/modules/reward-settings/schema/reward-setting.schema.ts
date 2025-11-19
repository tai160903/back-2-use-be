import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RewardSettingDocument = HydratedDocument<RewardSetting>;

@Schema({ timestamps: true })
export class RewardSetting {
  @Prop({ type: Number, required: true })
  rewardSuccess: number;

  @Prop({ type: Number, required: true })
  rewardLate: number;

  @Prop({ type: Number, required: true })
  rewardFailed: number;

  @Prop({ type: Number, required: true })
  rankingSuccess: number;

  @Prop({ type: Number, required: true })
  rankingLate: number;

  @Prop({ type: Number, required: true })
  rankingFailedPenalty: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const RewardSettingSchema = SchemaFactory.createForClass(RewardSetting);
