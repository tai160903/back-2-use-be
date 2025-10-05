import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { BaseBusinessFields } from './base-business.schema';
import { BusinessFormStatusEnum } from '../../../common/constants/business-form-status.enum';

export type BusinessFormDocument = HydratedDocument<BusinessForm>;

@Schema({ timestamps: true })
export class BusinessForm extends BaseBusinessFields {
  @Prop({ required: true })
  storeMail: string;

  @Prop({
    enum: Object.values(BusinessFormStatusEnum),
    default: BusinessFormStatusEnum.PENDING,
  })
  status: BusinessFormStatusEnum;

  @Prop()
  rejectNote: string;
}

export const BusinessFormSchema = SchemaFactory.createForClass(BusinessForm);
