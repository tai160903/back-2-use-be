import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { PaymentMethod } from 'src/common/constants/payment-method.enum';
import { TransactionType } from 'src/common/constants/transaction-type.enum';
import { UserType } from 'src/common/constants/user-type.enum';
import { WalletBalanceType } from 'src/common/constants/wallet-balance-type.enum';
import { WalletDirection } from 'src/common/constants/wallet-direction.enum';
import { WalletReferenceType } from 'src/common/constants/wallet-reference-type.enum';
import { WalletTransactionStatus } from 'src/common/constants/wallet-transaction-status.enum';

export type WalletTransactionsDocument = HydratedDocument<WalletTransactions>;

@Schema({ timestamps: true })
export class WalletTransactions {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Wallets' })
  walletId: Types.ObjectId;

  @Prop({ type: Types.ObjectId })
  relatedUserId?: Types.ObjectId;

  @Prop({ enum: UserType })
  relatedUserType?: string;

  @Prop({
    required: true,
    enum: Object.values(TransactionType),
  })
  transactionType: TransactionType;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: WalletDirection })
  direction: string;

  @Prop({ type: Types.ObjectId })
  referenceId?: Types.ObjectId;

  @Prop({
    enum: WalletReferenceType,
    default: WalletReferenceType.MANUAL,
  })
  referenceType?: string;

  @Prop({ type: String, enum: WalletBalanceType, default: null })
  balanceType?: string | null;

  @Prop({ type: String, enum: WalletBalanceType, default: null })
  toBalanceType?: string | null;

  @Prop()
  description?: string;

  @Prop({ type: String })
  paymentUrl?: string;

  @Prop({ type: String, enum: PaymentMethod })
  paymentMethod?: string;

  @Prop({
    required: true,
    enum: WalletTransactionStatus,
    default: WalletTransactionStatus.PROCESSING,
  })
  status: string;
}

export const WalletTransactionsSchema =
  SchemaFactory.createForClass(WalletTransactions);
