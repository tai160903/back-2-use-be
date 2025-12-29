import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SingleUseProductSizeDocument =
  HydratedDocument<SingleUseProductSize>;

@Schema({ timestamps: true })
export class SingleUseProductSize {
  @Prop({
    type: Types.ObjectId,
    ref: 'SingleUseProductType',
    required: true,
  })
  productTypeId: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  sizeName: string; // S, M, L, 12oz, 16oz...

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  minWeight: number; // gram

  @Prop({
    type: Number,
    required: true,
    min: 0,
  })
  maxWeight: number; // gram

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}

export const SingleUseProductSizeSchema =
  SchemaFactory.createForClass(SingleUseProductSize);

SingleUseProductSizeSchema.index(
  { productTypeId: 1, sizeName: 1 },
  { unique: true },
);
