import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  SingleUseProductSize,
  SingleUseProductSizeSchema,
} from '../single-use-product-size/schemas/single-use-product-size.schema';
import {
  SingleUseProductType,
  SingleUseProductTypeSchema,
} from '../single-use-product-type/schemas/single-use-product-type.schema';
import { SingleUseProductController } from './single-use-product.controller';
import { SingleUseProductService } from './single-use-product.service';
import { Material, MaterialSchema } from '../materials/schemas/material.schema';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import {
  SingleUseProduct,
  SingleUseProductSchema,
} from './schemas/single-use-product.schema';
import { CloudinaryModule } from 'src/infrastructure/cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SingleUseProductSize.name, schema: SingleUseProductSizeSchema },
      { name: SingleUseProductType.name, schema: SingleUseProductTypeSchema },
      { name: SingleUseProduct.name, schema: SingleUseProductSchema },
      { name: Material.name, schema: MaterialSchema },
      { name: Businesses.name, schema: BusinessesSchema },
    ]),
  ],
  controllers: [SingleUseProductController],
  providers: [SingleUseProductService],
})
export class SingleUseProductModule {}
