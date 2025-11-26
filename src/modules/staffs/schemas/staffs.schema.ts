import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type StaffDocument = HydratedDocument<Staff>;

@Schema({ timestamps: true })
export class Staff {
  @Prop({ type: Types.ObjectId, ref: 'Businesses', required: true })
  businessId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Users' })
  userId?: Types.ObjectId;

  @Prop({ required: true })
  fullName: string;

  @Prop({ required: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: true })
  position: string; // e.g. cashier, manager

  @Prop({ enum: ['staff', 'manager'], default: 'staff' })
  staffRole: string; // internal staff role (authorization within business)

  @Prop({
    enum: ['active', 'inactive', 'removed'],
    default: 'active',
  })
  status: string;
}

export const StaffSchema = SchemaFactory.createForClass(Staff);
