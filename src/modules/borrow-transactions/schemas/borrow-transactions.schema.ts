import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BorrowTransactionStatus } from 'src/common/constants/borrow-transaction-status.enum';
import { BorrowTransactionType } from 'src/common/constants/borrow-transaction-type.enum';
import { ProductFace } from 'src/common/constants/product-face.enum';

export type BorrowTransactionDocument = HydratedDocument<BorrowTransaction>;

@Schema({ timestamps: true })
export class BorrowTransaction {
  @Prop({ required: true, ref: 'Customers', type: Types.ObjectId })
  customerId: Types.ObjectId;

  @Prop({ required: true, ref: 'Product', type: Types.ObjectId })
  productId: Types.ObjectId;

  @Prop({ required: true, ref: 'Businesses', type: Types.ObjectId })
  businessId: Types.ObjectId;

  @Prop({ enum: BorrowTransactionType, required: true })
  borrowTransactionType: string;

  @Prop({ required: true })
  borrowDate: Date;

  @Prop({ required: true })
  dueDate: Date;

  @Prop()
  returnDate: Date;

  @Prop({ required: true })
  depositAmount: number;

  @Prop({
    enum: BorrowTransactionStatus,
  })
  status: string;

  @Prop()
  qrCode: string;

  @Prop({ type: Number, default: 0 })
  extensionCount?: number;

  @Prop({ type: Date })
  lastExtensionDate?: Date;

  @Prop()
  rewardPointChanged?: number;

  @Prop()
  rankingPointChanged?: number;

  @Prop()
  ecoPointChanged?: number;

  @Prop()
  co2Changed?: number;

  @Prop({ default: false })
  isLateProcessed: boolean;

  @Prop({
    type: {
      topImage: String,
      bottomImage: String,
      frontImage: String,
      backImage: String,
      leftImage: String,
      rightImage: String,
    },
    default: {},
  })
  previousConditionImages: {
    topImage?: string;
    bottomImage?: string;
    frontImage?: string;
    backImage?: string;
    leftImage?: string;
    rightImage?: string;
  };

  @Prop({
    type: {
      topImage: String,
      bottomImage: String,
      frontImage: String,
      backImage: String,
      leftImage: String,
      rightImage: String,
    },
    default: {},
  })
  currentConditionImages: {
    topImage?: string;
    bottomImage?: string;
    frontImage?: string;
    backImage?: string;
    leftImage?: string;
    rightImage?: string;
  };

  @Prop({
    type: [
      {
        face: {
          type: String,
          enum: Object.values(ProductFace),
          required: true,
        },
        issue: { type: String, required: true },
      },
    ],
    default: [],
  })
  previousDamageFaces: Array<{
    face: ProductFace;
    issue: string;
  }>;

  @Prop({
    type: [
      {
        face: {
          type: String,
          enum: Object.values(ProductFace),
          required: true,
        },
        issue: { type: String, required: true },
      },
    ],
    default: [],
  })
  currentDamageFaces: Array<{
    face: ProductFace;
    issue: string;
  }>;

  @Prop({ type: Number, default: 0 })
  totalConditionPoints: number;

  @Prop({ type: Boolean, default: false })
  dueNotificationSent: boolean;

  @Prop({ type: Date })
  dueNotificationSentAt: Date;

  @Prop({ type: Boolean, default: false })
  dueDateNotificationSent: boolean;

  @Prop({ type: Date })
  dueDateNotificationSentAt: Date;
}

export const BorrowTransactionSchema =
  SchemaFactory.createForClass(BorrowTransaction);
