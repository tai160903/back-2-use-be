import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

@Schema({ timestamps: true })
export class Product {
  @Prop({ ref: 'ProductGroup', type: Types.ObjectId, required: true })
  productGroupId: Types.ObjectId;

  @Prop({ ref: 'ProductSize', type: Types.ObjectId, required: true })
  productSizeId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  qrCode: string;

  @Prop({ required: true, trim: true })
  serialNumber: string;

  @Prop({
    enum: ['available', 'non-available'],
    default: 'available',
  })
  status: string;

  @Prop({ enum: ['good', 'damaged', 'expired', 'lost'] })
  condition: string;

  @Prop({ default: 0 })
  reuseCount: number;

  @Prop()
  lastConditionNote: string;

  @Prop({ type: [String], default: [] })
  lastConditionImages: string[];

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
