import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Businesses, BusinessesSchema } from './schemas/businesses.schema';
import { CloudinaryModule } from 'src/infrastructure/cloudinary/cloudinary.module';
import {
  BusinessForm,
  BusinessFormSchema,
} from './schemas/business-form.schema';
import {
  Subscriptions,
  SubscriptionsSchema,
} from '../subscriptions/schemas/subscriptions.schema';
import {
  BusinessSubscriptions,
  BusinessSubscriptionsSchema,
} from './schemas/business-subscriptions.schema';
import { Wallets, WalletsSchema } from '../wallets/schemas/wallets.schema';
import { Users, UsersSchema } from '../users/schemas/users.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Businesses.name,
        schema: BusinessesSchema,
      },
      { name: BusinessForm.name, schema: BusinessFormSchema },
      { name: Subscriptions.name, schema: SubscriptionsSchema },
      { name: BusinessSubscriptions.name, schema: BusinessSubscriptionsSchema },
      { name: Wallets.name, schema: WalletsSchema },
      { name: Users.name, schema: UsersSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
