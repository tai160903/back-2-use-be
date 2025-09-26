import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UsersDocument = HydratedDocument<Users>;

@Schema()
export class Users {
  @Prop({ required: true })
  email: string;
  @Prop({ required: true })
  password: string;
  @Prop({ required: true })
  name: string;
  @Prop({ required: true })
  phone: string;
  @Prop()
  avatar: string;
  @Prop()
  address: string;
  @Prop()
  yob: Date;
  @Prop({
    required: true,
    enum: ['customer', 'business', 'admin'],
    default: 'customer',
  })
  role: string;
  @Prop({ required: true, default: false })
  isBlocked: boolean;
}

export const UsersSchema = SchemaFactory.createForClass(Users);
