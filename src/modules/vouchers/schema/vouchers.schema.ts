// schemas/voucher.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, HydratedDocument, Types } from 'mongoose';
import { VoucherType } from 'src/common/constants/voucher-types.enum';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';

export type VouchersDocument = HydratedDocument<Vouchers>;

@Schema({ timestamps: true, minimize: false })
export class Vouchers {
  @Prop({ type: Types.ObjectId, ref: 'EcoRewardPolicy' })
  ecoRewardPolicyId?: Types.ObjectId;

  @Prop({ enum: VoucherType, required: true })
  voucherType: VoucherType;

  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ required: true, trim: true })
  description: string;

  @Prop({ type: Number, min: 0, max: 100 })
  discountPercent?: number;

  @Prop({ required: true, trim: true })
  baseCode: string;

  @Prop({ type: Number, min: 0 })
  rewardPointCost?: number;

  @Prop({ type: Number, min: 0 })
  redeemedCount?: number;

  @Prop({ type: Number, min: 1 })
  maxUsage?: number;

  @Prop({ type: Date })
  startDate?: Date;

  @Prop({ type: Date })
  endDate?: Date;

  @Prop({ enum: VouchersStatus, default: VouchersStatus.TEMPLATE })
  status: VouchersStatus;

  @Prop({ type: Boolean })
  isDisabled?: boolean;

  @Prop({ type: Boolean })
  isPublished?: boolean;
}

export const VouchersSchema = SchemaFactory.createForClass(Vouchers);
