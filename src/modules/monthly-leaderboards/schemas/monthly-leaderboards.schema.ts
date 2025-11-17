import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type MonthlyLeaderboardDocument = HydratedDocument<MonthlyLeaderboard>;

@Schema({ timestamps: true })
export class MonthlyLeaderboard {
  @Prop({ type: Types.ObjectId, ref: 'Customers', required: true })
  customerId: Types.ObjectId;

  @Prop({ required: true })
  month: number;

  @Prop({ required: true })
  year: number;

  @Prop({ required: true })
  rankingPoints: number;

  @Prop({ required: true })
  rank: number;

  @Prop()
  lockedAt: Date;
}

export const MonthlyLeaderboardSchema =
  SchemaFactory.createForClass(MonthlyLeaderboard);
