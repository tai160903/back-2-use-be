import { Module } from '@nestjs/common';
import { ProductSizesService } from './product-sizes.service';
import { ProductSizesController } from './product-sizes.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductSize, ProductSizeSchema } from './schemas/product-size.schema';
import { BusinessSubscriptionGuard } from 'src/common/guards/business-subscription.guard';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import {
  BusinessSubscriptions,
  BusinessSubscriptionsSchema,
} from '../businesses/schemas/business-subscriptions.schema';
import {
  ProductGroup,
  ProductGroupSchema,
} from '../product-groups/schemas/product-group.schema';
import { Users, UsersSchema } from '../users/schemas/users.schema';
import { Material, MaterialSchema } from '../materials/schemas/material.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductSize.name, schema: ProductSizeSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: BusinessSubscriptions.name, schema: BusinessSubscriptionsSchema },
      { name: ProductGroup.name, schema: ProductGroupSchema },
      { name: Users.name, schema: UsersSchema },
      { name: Material.name, schema: MaterialSchema },
    ]),
  ],
  controllers: [ProductSizesController],
  providers: [ProductSizesService, BusinessSubscriptionGuard],
})
export class ProductSizesModule {}
