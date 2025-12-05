import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { RolesEnum } from 'src/common/constants/roles.enum';

export type UsersDocument = HydratedDocument<Users>;

@Schema({ timestamps: true })
export class Users {
  @Prop({ unique: true, lowercase: true, trim: true })
  username: string;

  @Prop({ unique: true, lowercase: true, trim: true })
  email: string;

  @Prop({ required: true, select: false })
  password: string;

  @Prop()
  avatar: string;

  @Prop({
    type: [String],
    enum: Object.values(RolesEnum),
    default: [RolesEnum.CUSTOMER],
  })
  role: RolesEnum[];

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
