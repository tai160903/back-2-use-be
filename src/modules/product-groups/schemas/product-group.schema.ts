import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductGroupDocument = HydratedDocument<ProductGroup>;

@Schema({ timestamps: true })
export class ProductGroup {
  @Prop({ ref: 'Material', required: true })
  materialId: Types.ObjectId;

  @Prop({ ref: 'Businesses', required: true })
  businessId: Types.ObjectId;

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
