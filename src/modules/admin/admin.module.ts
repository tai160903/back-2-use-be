import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminMaterialController } from './controllers/admin-material.controller';
import { AdminMaterialService } from './services/admin-material.service';
import {
  BusinessForm,
  BusinessFormSchema,
} from '../businesses/schemas/business-form.schema';
import { Material, MaterialSchema } from '../materials/schemas/material.schema';
import { BusinessesModule } from '../businesses/businesses.module';

import { Users, UsersSchema } from '../users/schemas/users.schema';
import {
  Businesses,
  BusinessesSchema,
} from '../businesses/schemas/businesses.schema';
import { AdminCustomerController } from './controllers/admin-customer.controller';
import { AdminCustomerService } from './services/admin-customer.service';
import { AdminBusinessController } from './controllers/admin-business.controller';
import { AdminBusinessService } from './services/admin-business.service';
import { MailerModule } from 'src/infrastructure/mailer/mailer.module';
import { AdminBusinessFormController } from './controllers/admin-business-form.controller';
import { AdminBusinessFormService } from './services/admin-business-form.service';
import {
  UserBlockHistory,
  UserBlockHistorySchema,
} from '../users/schemas/users-block-history';
import { Customers, CustomersSchema } from '../users/schemas/customer.schema';
import {
  Subscriptions,
  SubscriptionsSchema,
} from '../subscriptions/schemas/subscriptions.schema';
import {
  BusinessSubscriptions,
  BusinessSubscriptionsSchema,
} from '../businesses/schemas/business-subscriptions.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessForm.name, schema: BusinessFormSchema },
      { name: Customers.name, schema: CustomersSchema },
      { name: Material.name, schema: MaterialSchema },
      { name: Users.name, schema: UsersSchema },
      { name: Businesses.name, schema: BusinessesSchema },
      { name: UserBlockHistory.name, schema: UserBlockHistorySchema },
      { name: Subscriptions.name, schema: SubscriptionsSchema },
      { name: BusinessSubscriptions.name, schema: BusinessSubscriptionsSchema },
    ]),
    BusinessesModule,

    MailerModule,
  ],
  controllers: [
    AdminBusinessFormController,
    AdminMaterialController,
    AdminCustomerController,
    AdminBusinessController,
  ],
  providers: [
    AdminBusinessFormService,
    AdminMaterialService,
    AdminCustomerService,
    AdminBusinessService,
  ],
})
export class AdminModule {}
