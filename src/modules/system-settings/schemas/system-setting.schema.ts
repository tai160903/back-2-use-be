import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type SystemSettingDocument = HydratedDocument<SystemSetting>;

@Schema({ timestamps: true })
export class SystemSetting {
  @Prop({ type: String, required: true })
  category: string;

  @Prop({ type: String, required: true })
  key: string;

  @Prop({ type: Object, required: true })
  value: Record<string, any>;

  @Prop({ type: String })
  description?: string;

  @Prop({ type: Types.ObjectId, ref: 'Users' })
  updatedBy: Types.ObjectId;
}

export const SystemSettingSchema = SchemaFactory.createForClass(SystemSetting);

SystemSettingSchema.index({ category: 1, key: 1 }, { unique: true });
