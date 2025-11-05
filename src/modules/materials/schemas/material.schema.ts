import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';
import { MaterialStatus } from 'src/common/constants/material-status.enum';

export type MaterialDocument = HydratedDocument<Material>;

@Schema({ timestamps: true })
export class Material {
  @Prop({ required: true })
  materialName: string;

  @Prop({ required: true })
  reuseLimit: number;

  @Prop({ required: true })
  depositPercent: number;

  @Prop({ required: true })
  description: string;

  // @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true })
  // createdBy: Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);

MaterialSchema.index({ materialName: 1 }, { unique: true });
