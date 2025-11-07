import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductSizeDocument = HydratedDocument<ProductSize>;

@Schema({ timestamps: true })
export class ProductSize {
  @Prop({ ref: 'ProductGroup', required: true })
  productGroupId: string;

  @Prop({ required: true, trim: true })
  sizeName: string;

  @Prop()
  basePrice: string;

  @Prop()
  depositValue: string;
}

export const ProductSizeSchema = SchemaFactory.createForClass(ProductSize);
