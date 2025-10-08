import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RolesEnum } from 'src/common/constants/roles.enum';

export type UsersDocument = HydratedDocument<Users>;

@Schema({ timestamps: true })
export class Users {
  @Prop({ required: true })
  email: string;
  @Prop({ required: true, select: false })
  password: string;
  @Prop({ required: true })
  name: string;
  @Prop()
  phone: string;
  @Prop()
  avatar: string;
  @Prop()
  address: string;
  @Prop()
  yob: Date;
  @Prop({
    required: true,
    enum: Object.values(RolesEnum),
    default: RolesEnum.CUSTOMER,
  })
  role: RolesEnum;
  @Prop({ required: true, default: false })
  isActive: boolean;
  @Prop({ required: true, default: false })
  isBlocked: boolean;
  @Prop()
  otpCode: string;
  @Prop()
  otpExpires: Date;
}

export const UsersSchema = SchemaFactory.createForClass(Users);
