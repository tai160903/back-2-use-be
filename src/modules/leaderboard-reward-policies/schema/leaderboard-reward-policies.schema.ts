import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LeaderboardRewardPolicyDocument =
  HydratedDocument<LeaderboardRewardPolicy>;

@Schema({ timestamps: true })
export class LeaderboardRewardPolicy {
  @Prop({ type: Types.ObjectId, ref: 'Vouchers', required: true })
  voucherId: Types.ObjectId;

  @Prop({ type: Number, required: true })
  month: number;

  @Prop({ type: Number, required: true })
  year: number;

  @Prop({ type: Number, required: true })
  rankFrom: number;

  @Prop({ type: Number, required: true })
  rankTo: number;

  @Prop({ type: String })
  note: string;
}

export const LeaderboardRewardPolicySchema = SchemaFactory.createForClass(
  LeaderboardRewardPolicy,
);
