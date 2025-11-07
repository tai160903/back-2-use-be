import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ ref: 'ProductGroup', required: true })
  productGroupId: string;

  @Prop({ ref: 'ProductSize', required: true })
  productSizeId: string;

  @Prop({ required: true, trim: true })
  qrCode: string;

  @Prop({ required: true, trim: true })
  serialNumber: string;

  @Prop({ required: true, enum: ['available', 'non-available'] })
  status: string;

  @Prop()
  reuseCount: number;

  @Prop()
  lastConditionNote: string;

  @Prop()
  lastConditionImage: string;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
