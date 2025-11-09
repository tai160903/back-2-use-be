import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';

export type BusinessVoucherDocument = HydratedDocument<BusinessVouchers>;

@Schema({ timestamps: true })
export class BusinessVouchers {
  @Prop({ type: Types.ObjectId, ref: 'Vouchers', required: true })
  templateVoucherId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Businesses', required: true })
  businessId: Types.ObjectId;

  @Prop({ trim: true })
  customName?: string;

  @Prop({ trim: true })
  customDescription?: string;

  @Prop({ min: 0, max: 100 })
  discountPercent?: number;

  @Prop({ min: 0 })
  rewardPointCost?: number;

  @Prop()
  startDate?: Date;

  @Prop()
  endDate?: Date;

  @Prop({ enum: VouchersStatus, default: VouchersStatus.CLAIMED })
  status: VouchersStatus;

  @Prop({ default: false })
  isPublished: boolean;
}
