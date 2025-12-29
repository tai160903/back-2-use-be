import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SingleUseProductTypeDocument =
  HydratedDocument<SingleUseProductType>;

@Schema({ timestamps: true })
export class SingleUseProductType {
  @Prop({
    required: true,
    trim: true,
  })
  name: string;

  @Prop({
    type: Boolean,
    default: true,
  })
  isActive: boolean;
}

export const SingleUseProductTypeSchema =
  SchemaFactory.createForClass(SingleUseProductType);

SingleUseProductTypeSchema.index({ name: 1 }, { unique: true });
