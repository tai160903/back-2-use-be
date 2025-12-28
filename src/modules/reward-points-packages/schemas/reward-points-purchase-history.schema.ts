import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RewardPointsPurchaseHistoryDocument =
  HydratedDocument<RewardPointsPurchaseHistory>;

@Schema({ timestamps: true })
export class RewardPointsPurchaseHistory {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Businesses' })
  businessId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'RewardPointsPackage' })
  packageId: Types.ObjectId;

  @Prop({ required: true })
  packageName: string;

  @Prop({ required: true })
  points: number;

  @Prop({ required: true })
  amount: number;

  @Prop({ type: Types.ObjectId, ref: 'WalletTransactions' })
  transactionId?: Types.ObjectId;

  @Prop({ default: 'completed' })
  status: string;
}

export const RewardPointsPurchaseHistorySchema = SchemaFactory.createForClass(
  RewardPointsPurchaseHistory,
);
