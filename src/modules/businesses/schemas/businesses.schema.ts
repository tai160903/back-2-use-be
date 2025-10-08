import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { BaseBusinessFields } from './base-business.schema';
import { BusinessStatusEnum } from '../../../common/constants/business-status.enum';

export type BusinessDocument = HydratedDocument<Businesses>;

@Schema({ timestamps: true })
export class Businesses extends BaseBusinessFields {
  @Prop({ unique: true, ref: 'Users', required: true })
  userId: Types.ObjectId;

  @Prop({
    enum: Object.values(BusinessStatusEnum),
    default: BusinessStatusEnum.PENDING,
  })
  status: BusinessStatusEnum;

  @Prop()
  trailStartDate: Date;

  @Prop()
  trailEndDate: Date;
}

export const BusinessesSchema = SchemaFactory.createForClass(Businesses);
