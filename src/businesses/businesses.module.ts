import { Module } from '@nestjs/common';
import { BusinessesService } from './businesses.service';
import { BusinessesController } from './businesses.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Businesses, BusinessesSchema } from './schemas/businesses.schema';
import { CloudinaryModule } from 'src/cloudinary/cloudinary.module';
import {
  BusinessForm,
  BusinessFormSchema,
} from './schemas/business-form.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Businesses.name,
        schema: BusinessesSchema,
      },
      { name: BusinessForm.name, schema: BusinessFormSchema },
    ]),
    CloudinaryModule,
  ],
  controllers: [BusinessesController],
  providers: [BusinessesService],
  exports: [BusinessesService],
})
export class BusinessesModule {}
