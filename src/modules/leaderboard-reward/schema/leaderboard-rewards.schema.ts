import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type LeaderboardRewardDocument = HydratedDocument<LeaderboardReward>;

@Schema({ timestamps: true })
export class LeaderboardReward {
  @Prop({ type: Types.ObjectId, ref: 'MonthlyLeaderboard', required: true })
  leaderboardId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'LeaderboardRewardPolicy',
    required: true,
  })
  rewardPolicyId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'VoucherCodes', required: true })
  voucherCodeId: Types.ObjectId;

  @Prop({ type: Date, default: Date.now })
  rewardedAt: Date;

  @Prop({ type: String })
  note: string;
}

export const LeaderboardRewardSchema =
  SchemaFactory.createForClass(LeaderboardReward);
