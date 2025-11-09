import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { VoucherCodeStatus } from 'src/common/constants/voucher-codes-status.enum';

export type VoucherCodesDocument = VoucherCodes & Document;

@Schema({ timestamps: true })
export class VoucherCodes {
  @Prop({ type: Types.ObjectId, ref: 'Vouchers', required: true, index: true })
  voucherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customers', required: true, index: true })
  redeemedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Businesses' })
  usedByBusinessId?: Types.ObjectId;

  @Prop({ required: true, unique: true })
  fullCode: string;

  @Prop({
    type: String,
    enum: VoucherCodeStatus,
    default: VoucherCodeStatus.REDEEMED,
  })
  status: VoucherCodeStatus;

  @Prop({ default: Date.now })
  redeemedAt: Date;

  @Prop()
  usedAt?: Date;

  @Prop()
  expiresAt?: Date;
}

export const VoucherCodesSchema = SchemaFactory.createForClass(VoucherCodes);
