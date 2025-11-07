import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type ProductGroupDocument = HydratedDocument<ProductGroup>;

@Schema({ timestamps: true })
export class ProductGroup {
  @Prop({ ref: 'Material', required: true })
  materialId: string;

  @Prop({ ref: 'Businesses', required: true })
  businessId: string;
  @Prop({ required: true, trim: true })
  name: string;

  @Prop({ trim: true })
  description: string;

  @Prop({ trim: true })
  imageUrl: string;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ProductGroupSchema = SchemaFactory.createForClass(ProductGroup);
