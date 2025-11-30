import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { ProductCondition } from 'src/common/constants/product-condition.enum';
import { ProductFace } from 'src/common/constants/product-face.enum';
import { ProductStatus } from 'src/common/constants/product-status.enum';

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
    enum: ProductStatus,
    default: ProductStatus.AVAILABLE,
  })
  status: string;

  @Prop({ enum: ProductCondition, default: ProductCondition.GOOD })
  condition: string;

  @Prop({ default: 0 })
  reuseCount: number;

  @Prop()
  lastConditionNote: string;

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
  lastConditionImages: {
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
  lastDamageFaces: {
    face: ProductFace;
    issue: string;
  }[];

  @Prop({ default: false })
  isDeleted: boolean;
}

export const ProductSchema = SchemaFactory.createForClass(Product);
