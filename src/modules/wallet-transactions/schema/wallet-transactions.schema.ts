import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { TransactionType } from 'src/common/constants/transaction-type.enum';

export type WalletTransactionsDocument = HydratedDocument<WalletTransactions>;

@Schema({ timestamps: true })
export class WalletTransactions {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Wallets' })
  walletId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  relatedUserId?: Types.ObjectId;

  @Prop({ enum: ['customer', 'business'] })
  relatedUserType?: string;

  @Prop({
    required: true,
    enum: Object.values(TransactionType),
  })
  transactionType: TransactionType;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['in', 'out'] })
  direction: string;

  @Prop({ type: Types.ObjectId })
  referenceId?: Types.ObjectId;

  @Prop({
    enum: ['borrow', 'subscription', 'system', 'manual'],
    default: 'manual',
  })
  referenceType?: string;

  @Prop({ type: String, enum: ['available', 'holding'], default: null })
  balanceType?: string | null;

  @Prop({ type: String, enum: ['available', 'holding'], default: null })
  toBalanceType?: string | null;

  @Prop()
  description?: string;

  @Prop({ type: String })
  paymentUrl?: string;

  @Prop({ type: String, enum: ['vnpay', 'momo'] })
  paymentMethod?: string;

  @Prop({
    required: true,
    enum: ['processing', 'completed', 'failed', 'expired'],
    default: 'processing',
  })
  status: string;
}

export const WalletTransactionsSchema =
  SchemaFactory.createForClass(WalletTransactions);
