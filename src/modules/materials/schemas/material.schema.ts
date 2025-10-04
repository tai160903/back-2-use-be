import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

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
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
