import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BusinessFormStatusEnum } from '../../../common/constants/business-form-status.enum';

export type BusinessFormDocument = HydratedDocument<BusinessForm>;

@Schema({ timestamps: true })
export class BusinessForm {
  @Prop({ required: true })
  storeMail: string;

  @Prop({ required: true })
  storeName: string;

  @Prop({ required: true })
  taxCode: string;

  @Prop({ required: true })
  storeAddress: string;

  @Prop({ required: true })
  storePhone: string;

  @Prop({ required: true })
  foodSafetyCertUrl: string;

  @Prop({ required: true })
  businessLicenseUrl: string;

  @Prop({
    enum: Object.values(BusinessFormStatusEnum),
    default: BusinessFormStatusEnum.PENDING,
  })
  status: BusinessFormStatusEnum;

  @Prop()
  rejectNote: string;
}

export const BusinessFormSchema = SchemaFactory.createForClass(BusinessForm);
