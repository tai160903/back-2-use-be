import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductSizeDocument = HydratedDocument<ProductSize>;

@Schema({ timestamps: true })
export class ProductSize {
  @Prop({ type: Types.ObjectId, ref: 'Businesses', required: true })
  businessId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'ProductGroup', required: true })
  productGroupId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  sizeName: string;

  @Prop({ type: Number, required: true })
  basePrice: number;

  @Prop({ type: Number, required: true })
  depositValue: number;
}

export const ProductSizeSchema = SchemaFactory.createForClass(ProductSize);
