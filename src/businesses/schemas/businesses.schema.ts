import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BusinessDocument = HydratedDocument<Businesses>;

@Schema({ timestamps: true })
export class Businesses {
  @Prop({ unique: true, ref: 'Users' })
  userId: Types.ObjectId;
  @Prop({ required: true })
  storeName: string;
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
  @Prop({ enum: ['pending', 'active', 'suspended'], default: 'pending' })
  status: string;
  @Prop()
  trailStartDate: Date;
  @Prop()
  trailEndDate: Date;
}

export const BusinessesSchema = SchemaFactory.createForClass(Businesses);
