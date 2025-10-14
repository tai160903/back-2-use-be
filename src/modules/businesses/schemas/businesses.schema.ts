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

  @Prop()
  businessName: string;

  @Prop()
  taxCode: string;

  @Prop()
  businessAddress: string;

  @Prop()
  businessPhone: string;

  @Prop()
  foodSafetyCertUrl: string;

  @Prop()
  businessLicenseUrl: string;

  @Prop({
    enum: Object.values(BusinessStatusEnum),
    default: BusinessStatusEnum.PENDING,
  })
  status: BusinessStatusEnum;
}

export const BusinessesSchema = SchemaFactory.createForClass(Businesses);
