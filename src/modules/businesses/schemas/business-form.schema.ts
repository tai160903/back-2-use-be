import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BusinessFormStatusEnum } from '../../../common/constants/business-form-status.enum';

export type BusinessFormDocument = HydratedDocument<BusinessForm>;

@Schema({ timestamps: true })
export class BusinessForm {
  @Prop({ required: true, ref: 'User' })
  customerId: Types.ObjectId;

  @Prop({ required: true })
  businessMail: string;

  @Prop({ required: true })
  businessName: string;

  @Prop({ required: true })
  taxCode: string;

  @Prop({ required: true })
  businessAddress: string;

  @Prop({ required: true })
  businessPhone: string;

  @Prop({ required: true })
  businessType: string;

  @Prop({ required: true })
  openTime: string;

  @Prop({ required: true })
  closeTime: string;

  @Prop({ required: true })
  businessLogoUrl: string;

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
