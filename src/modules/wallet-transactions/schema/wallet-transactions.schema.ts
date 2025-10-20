import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WalletTransactionsDocument = HydratedDocument<WalletTransactions>;

@Schema({ timestamps: true })
export class WalletTransactions {
  @Prop({ required: true, ref: 'Wallets' })
  walletId: Types.ObjectId; // Ví thực hiện giao dịch

  @Prop({ required: true, ref: 'Users' })
  userId: Types.ObjectId; // Người thực hiện giao dịch

  @Prop({ ref: 'Users' })
  relatedUserId?: Types.ObjectId; // User liên quan (vd: bên nhận cọc, bên hoàn tiền)

  @Prop({ required: true })
  amount: number; // Số tiền

  @Prop({
    required: true,
    enum: [
      'deposit',
      'withdraw',
      'borrow_deposit',
      'return_refund',
      'subscription_fee',
    ],
  })
  transactionType: string; // Loại giao dịch

  @Prop({
    required: true,
    enum: ['in', 'out'],
  })
  direction: string; // 'in' = tiền vào ví, 'out' = tiền ra ví

  @Prop({
    enum: ['processing', 'completed', 'failed'],
    default: 'processing',
  })
  status: string; // Trạng thái giao dịch

  @Prop()
  description?: string; // Mô tả thêm

  @Prop({
    enum: ['borrow', 'return', 'subscription', 'manual'],
    default: 'manual',
  })
  referenceType?: string; // Giao dịch thuộc loại nào (mượn, trả, phí, thủ công)

  @Prop()
  referenceId?: Types.ObjectId; // ID tham chiếu tới entity liên quan (borrowId, returnId...)
}

export const WalletTransactionsSchema =
  SchemaFactory.createForClass(WalletTransactions);
