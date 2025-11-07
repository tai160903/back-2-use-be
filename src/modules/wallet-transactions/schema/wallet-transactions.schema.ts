import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WalletTransactionsDocument = HydratedDocument<WalletTransactions>;

@Schema({ timestamps: true })
export class WalletTransactions {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Wallets' })
  walletId: Types.ObjectId; // Ví thực hiện giao dịch

  @Prop({ type: Types.ObjectId, required: true, ref: 'Users' })
  relatedUserId: Types.ObjectId; // Chủ sở hữu ví (customer / business)

  @Prop({ enum: ['customer', 'business'], required: true })
  relatedUserType: string; // Phân biệt loại user của ví

  @Prop({
    required: true,
    enum: [
      'top_up', // Nạp tiền vào ví
      'withdrawal', // Rút tiền ra
      'borrow_deposit', // Đặt cọc khi mượn
      'return_refund', // Hoàn cọc khi trả
      'subscription_fee', // Trừ phí gói dịch vụ
      'penalty', // Phạt (mất, trễ, hư, ...)
    ],
  })
  transactionType: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true, enum: ['in', 'out'] })
  direction: string; // Hướng dòng tiền (vào ví / ra khỏi ví)

  @Prop({ type: Types.ObjectId })
  referenceId?: Types.ObjectId; // ID tham chiếu (BorrowTransaction, Subscription, ...)

  @Prop({
    enum: ['borrow', 'subscription', 'system', 'manual'],
    default: 'manual',
  })
  referenceType?: string; // Loại đối tượng tham chiếu

  @Prop({
    enum: ['available', 'holding'],
    default: 'available',
  })
  fromBalanceType?: string; // Lấy tiền từ loại số dư nào

  @Prop()
  description?: string;

  @Prop({
    required: true,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
  })
  status: string;
}

export const WalletTransactionsSchema =
  SchemaFactory.createForClass(WalletTransactions);
