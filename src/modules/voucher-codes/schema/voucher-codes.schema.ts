import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { VoucherCodeStatus } from 'src/common/constants/voucher-codes-status.enum';
import { VoucherCodeType } from 'src/common/constants/voucher-codes-types.enum';

export type VoucherCodesDocument = VoucherCodes & Document;

@Schema({ timestamps: true })
export class VoucherCodes {
  @Prop({ type: Types.ObjectId, required: true, index: true })
  voucherId: Types.ObjectId;

  @Prop({
    type: String,
    enum: VoucherCodeType,
  })
  voucherType: VoucherCodeType;

  @Prop({ type: Types.ObjectId, ref: 'Businesses' })
  businessId?: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Customers', required: true })
  redeemedBy: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Businesses' })
  usedByBusinessId?: Types.ObjectId;

  @Prop({ required: true, unique: true, trim: true })
  fullCode: string;

  @Prop()
  qrCode: string;

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
  expiredAt?: Date;
}

export const VoucherCodesSchema = SchemaFactory.createForClass(VoucherCodes);

VoucherCodesSchema.index({ fullCode: 1 }, { unique: true });
VoucherCodesSchema.index({ voucherId: 1, redeemedBy: 1 }, { unique: true });
