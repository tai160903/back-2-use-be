// schemas/voucher.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';

export type VouchersDocument = Vouchers & Document;

export enum VouchersStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  EXPIRED = 'expired',
}

@Schema({ timestamps: true, minimize: false })
export class Vouchers {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: true, maxlength: 255 })
  name: string;

  @Prop({ required: true, maxlength: 1000 })
  description: string;

  @Prop({ required: true, min: 1, max: 100 })
  discount: number;

  @Prop({ required: true, maxlength: 255, index: true })
  baseCode: string;

  @Prop({ required: true, default: 0 })
  rewardPointCost: number;

  @Prop({ required: true })
  maxUsage: number;

  @Prop({ type: Date, default: () => new Date() })
  startDate: Date;

  @Prop({ type: Date, required: true })
  endDate: Date;

  @Prop({
    type: String,
    enum: VouchersStatus,
    default: VouchersStatus.ACTIVE,
  })
  status: VouchersStatus;

  @Prop({ default: 0 })
  redeemedCount: number;

  @Prop({ default: 0 })
  usedCount: number;
}

export const VouchersSchema = SchemaFactory.createForClass(Vouchers);
VouchersSchema.index({ baseCode: 1 });
