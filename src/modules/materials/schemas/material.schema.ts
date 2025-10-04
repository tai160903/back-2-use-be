import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type MaterialDocument = HydratedDocument<Material>;

export enum MaterialStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Material {
  @Prop({ required: true, unique: true })
  materialName: string;

  @Prop({ required: true })
  maximumReuse: number;

  @Prop({ type: String, enum: MaterialStatus, default: MaterialStatus.PENDING })
  status: MaterialStatus;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true })
  createdBy: Types.ObjectId;

  @Prop({ required: false })
  rejectReason?: string;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
