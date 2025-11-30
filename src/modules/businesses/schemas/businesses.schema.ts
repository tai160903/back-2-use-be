import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type BusinessDocument = HydratedDocument<Businesses>;

@Schema({ timestamps: true })
export class Businesses {
  @Prop({ type: Types.ObjectId, ref: 'BusinessForm', required: true })
  businessFormId: Types.ObjectId;

  @Prop({ unique: true, ref: 'Users', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true, trim: true })
  businessMail: string;

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
  openTime: string;

  @Prop({ required: true, trim: true })
  closeTime: string;

  @Prop({ required: true, trim: true })
  businessLogoUrl: string;

  @Prop({ required: true, trim: true })
  foodSafetyCertUrl: string;

  @Prop({ required: true, trim: true })
  businessLicenseUrl: string;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point',
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: number[];
  };

  @Prop({ default: 0 })
  co2Reduced: number;

  @Prop({ default: 0 })
  ecoPoints: number;

  @Prop({ trim: true })
  ecoRankLabel?: string;
}

export const BusinessesSchema = SchemaFactory.createForClass(Businesses);
BusinessesSchema.index({ location: '2dsphere' });
