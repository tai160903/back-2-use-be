import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type VoucherCodesDocument = VoucherCodes & Document;

export enum VoucherCodeStatus {
  REDEEMED = 'redeemed', // user đã đổi, chưa sử dụng
  USED = 'used', // business đã quét, đã dùng
  EXPIRED = 'expired', // hết hạn (tự động cập nhật)
}

@Schema({ timestamps: true })
export class VoucherCodes {
  // Tham chiếu về voucher cha
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vouchers',
    required: true,
  })
  voucherId: Types.ObjectId;

  // Mã code thực tế
  @Prop({ required: true, unique: true, maxlength: 255 })
  code: string;

  // User đã redeem
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Users', default: null })
  redeemedBy?: Types.ObjectId;

  // Thời điểm redeem
  @Prop({ type: Date, default: null })
  redeemedAt?: Date;

  // Business đã quét mã (ai xác nhận sử dụng)
  @Prop({
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Businesses',
    default: null,
  })
  usedBy?: Types.ObjectId;

  // Thời điểm được sử dụng
  @Prop({ type: Date, default: null })
  usedAt?: Date;

  // Trạng thái mã
  @Prop({
    type: String,
    enum: VoucherCodeStatus,
    default: VoucherCodeStatus.REDEEMED,
  })
  status: VoucherCodeStatus;
}

export const VoucherCodesSchema = SchemaFactory.createForClass(VoucherCodes);

// Index để tối ưu truy vấn
VoucherCodesSchema.index({ voucherId: 1 });
VoucherCodesSchema.index({ redeemedBy: 1 });
VoucherCodesSchema.index({ usedBy: 1 });
VoucherCodesSchema.index({ status: 1 });
