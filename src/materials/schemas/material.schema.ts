import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MaterialDocument = HydratedDocument<Material>;

@Schema({ timestamps: true })
export class Material {
  @Prop({ required: true, unique: true })
  materialName: string;

  @Prop({ required: true })
  maximumReuse: number;
}

export const MaterialSchema = SchemaFactory.createForClass(Material);
