import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BusinessStatusEnum } from '../../../common/constants/business-status.enum';

export type BusinessDocument = HydratedDocument<Businesses>;

@Schema({ timestamps: true })
export class Businesses {
  @Prop({ type: Types.ObjectId, ref: 'BusinessForm', required: true })
  businessFormId: Types.ObjectId;

  @Prop({ unique: true, ref: 'Users', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true, minlength: 3, maxlength: 100 })
  businessName: string;

  @Prop({ required: true, trim: true })
  taxCode: string;

  @Prop({ required: true, trim: true })
  businessAddress: string;

  @Prop({ required: true, trim: true })
  businessPhone: string;

  @Prop({ required: true, trim: true })
  businessType: string;

  @Prop({ required: true, trim: true })
  businessLogoUrl: string;

  @Prop({ required: true, trim: true })
  foodSafetyCertUrl: string;

  @Prop({ required: true, trim: true })
  businessLicenseUrl: string;

  @Prop({
    enum: Object.values(BusinessStatusEnum),
    default: BusinessStatusEnum.PENDING,
  })
  status: BusinessStatusEnum;
}

export const BusinessesSchema = SchemaFactory.createForClass(Businesses);
