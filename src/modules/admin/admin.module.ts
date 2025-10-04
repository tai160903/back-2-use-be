import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

import { AdminMaterialController } from './controllers/admin-material.controller';
import { AdminMaterialService } from './services/admin-material.service';
import {
  BusinessForm,
  BusinessFormSchema,
} from '../businesses/schemas/business-form.schema';
import { Material, MaterialSchema } from '../materials/schemas/material.schema';
import { BusinessesModule } from '../businesses/businesses.module';
import { MailerModule } from '../mailer/mailer.module';

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
