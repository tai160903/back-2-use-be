import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BusinessFormDocument = HydratedDocument<BusinessForm>;

@Schema({ timestamps: true })
export class BusinessForm {
  @Prop({ required: true })
  storeName: string;

  @Prop({ required: true })
  storeMail: string;

  @Prop({ required: true })
  storeAddress: string;

  @Prop({ required: true })
  storePhone: string;

  @Prop({ required: true })
  taxCode: string;

  @Prop({ required: true })
  foodLicenseUrl: string;

  @Prop({ required: true })
  businessLicenseUrl: string;

  @Prop({ required: true })
  email: string;

  @Prop({ enum: ['pending', 'approved', 'rejected'], default: 'pending' })
  status: string;

  @Prop()
  rejectNote: string;
}

export const BusinessFormSchema = SchemaFactory.createForClass(BusinessForm);
