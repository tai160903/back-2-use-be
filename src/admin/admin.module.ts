import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

import { BusinessesModule } from 'src/businesses/businesses.module';
import { MailerModule } from 'src/mailer/mailer.module';
import {
  BusinessForm,
  BusinessFormSchema,
} from 'src/businesses/schemas/business-form.schema';

import { AdminMaterialController } from './controllers/admin-material.controller';
import { AdminMaterialService } from './services/admin-material.service';
import {
  Material,
  MaterialSchema,
} from 'src/materials/schemas/material.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessForm.name, schema: BusinessFormSchema },
      { name: Material.name, schema: MaterialSchema },
    ]),
    BusinessesModule,
    MailerModule,
  ],
  controllers: [AdminController, AdminMaterialController],
  providers: [AdminService, AdminMaterialService],
})
export class AdminModule {}
