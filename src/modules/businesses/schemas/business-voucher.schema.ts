import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';
import { VoucherType } from 'src/common/constants/voucher-types.enum';

export type BusinessVoucherDocument = HydratedDocument<BusinessVouchers>;

@Schema({ timestamps: true })
export class BusinessVouchers {
  @Prop({ type: Types.ObjectId, ref: 'Vouchers' })
  templateVoucherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Businesses', required: true })
  businessId: Types.ObjectId;

  @Prop({ trim: true })
  customName?: string;

  @Prop({ trim: true })
  customDescription?: string;

  @Prop({ type: Number, min: 0, max: 100 })
  discountPercent: number;

  @Prop({ required: true, trim: true })
  baseCode: string;

  @Prop({ type: Number, min: 0 })
  rewardPointCost: number;

  @Prop({ type: Number, min: 0 })
  maxUsage?: number;

  @Prop({ type: Number, default: 0, min: 0 })
  redeemedCount: number;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ enum: VouchersStatus, default: VouchersStatus.CLAIMED })
  status: VouchersStatus;

  @Prop({ default: false })
  isPublished: boolean;

  @Prop({ default: false })
  isSetup: boolean;

  @Prop({ type: Date, default: Date.now })
  claimedAt: Date;

  @Prop({ type: String, default: VoucherType.BUSINESS })
  voucherType: string;
}

export const BusinessVouchersSchema =
  SchemaFactory.createForClass(BusinessVouchers);
