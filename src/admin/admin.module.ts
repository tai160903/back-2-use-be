import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { BusinessesModule } from 'src/businesses/businesses.module';
import { MailerModule } from 'src/mailer/mailer.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  BusinessForm,
  BusinessFormSchema,
} from 'src/businesses/schemas/business-form.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: BusinessForm.name, schema: BusinessFormSchema },
    ]),
    BusinessesModule,
    MailerModule,
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
