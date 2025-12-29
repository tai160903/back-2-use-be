import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SingleUseProductDocument = HydratedDocument<SingleUseProduct>;

@Schema({ timestamps: true })
export class SingleUseProduct {
  @Prop({
    type: Types.ObjectId,
    ref: 'Businesses',
    required: true,
  })
  businessId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SingleUseProductType',
    required: true,
  })
  productTypeId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'SingleUseProductSize',
    required: true,
  })
  productSizeId: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Material',
    required: true,
  })
  materialId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    trim: true,
  })
  description?: string;

  @Prop()
  imageUrl?: string;

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  weight: number; // gram (business nhập)

  @Prop({
    type: Number,
    required: true,
  })
  co2EmissionPerKg: number; // snapshot từ Material

  @Prop({
    type: Number,
    required: true,
  })
  co2Emission: number; // kg CO2 cho 1 sản phẩm

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}

export const SingleUseProductSchema =
  SchemaFactory.createForClass(SingleUseProduct);

SingleUseProductSchema.index(
  {
    businessId: 1,
    productTypeId: 1,
    productSizeId: 1,
    materialId: 1,
  },
  {
    unique: true,
    partialFilterExpression: { isActive: true },
  },
);
