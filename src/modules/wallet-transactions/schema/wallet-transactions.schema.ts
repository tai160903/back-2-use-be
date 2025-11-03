import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WalletTransactionsDocument = HydratedDocument<WalletTransactions>;

@Schema({ timestamps: true })
export class WalletTransactions {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Wallets' })
  walletId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true, ref: 'Users' })
  relatedUserId: Types.ObjectId;

  @Prop({ enum: ['customer', 'business'], required: true })
  relatedUserType: string;

  @Prop({
    required: true,
    enum: [
      'topup',
      'withdrawal',
      'borrow_deposit',
      'return_refund',
      'subscription_payment',
      'subscription_fee',
      'penalty',
    ],
  })
  transactionType: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['in', 'out'] })
  direction: string;

  @Prop()
  referenceId: string;

  @Prop()
  referenceType: string;

  @Prop()
  description: string;

  @Prop({ required: true, enum: ['pending', 'completed', 'failed'] })
  status: string;
}

export const WalletTransactionsSchema =
  SchemaFactory.createForClass(WalletTransactions);
