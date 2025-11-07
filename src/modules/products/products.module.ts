import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MongooseModule } from '@nestjs/mongoose';
import {
  ProductGroup,
  ProductGroupSchema,
} from './schemas/product-group.schema';
import { Users, UsersSchema } from '../users/schemas/users.schema';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import { Material, MaterialSchema } from '../materials/schemas/material.schema';
import {
  BusinessSubscriptions,
  BusinessSubscriptionsSchema,
} from '../businesses/schemas/business-subscriptions.schema';
import { BusinessSubscriptionGuard } from 'src/common/guards/business-subscription.guard';
import { CloudinaryModule } from 'src/infrastructure/cloudinary/cloudinary.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ProductGroup.name, schema: ProductGroupSchema },
      { name: Users.name, schema: UsersSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: Material.name, schema: MaterialSchema },
      { name: BusinessSubscriptions.name, schema: BusinessSubscriptionsSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, BusinessSubscriptionGuard],
})
export class ProductsModule {}
