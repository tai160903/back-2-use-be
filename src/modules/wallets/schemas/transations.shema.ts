import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type TransactionsDocument = HydratedDocument<Transactions>;

@Schema({ timestamps: true })
export class Transactions {
  @Prop({ required: true, ref: 'Wallets' })
  walletId: Types.ObjectId;
  @Prop({ required: true })
  amount: number;
  @Prop({ required: true, enum: ['deposit', 'withdraw'] })
  type: string;
  @Prop({
    required: true,
    default: 'pending',
    enum: ['pending', 'completed', 'failed'],
  })
  status: string;
}

export const TransactionsSchema = SchemaFactory.createForClass(Transactions);
