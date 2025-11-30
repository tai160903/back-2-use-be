import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { NotificationTypeEnum } from 'src/common/constants/notification.enum';
import { NotificationReferenceTypeEnum } from 'src/common/constants/notification-reference-type.enum';
import { UserType } from 'src/common/constants/user-type.enum';
export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, ref: 'User' })
  receiverId: Types.ObjectId;

  @Prop({ enum: UserType, required: true })
  receiverType: string;

  @Prop({
    enum: NotificationTypeEnum,
  })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({})
  referenceId: Types.ObjectId;

  @Prop({
    enum: NotificationReferenceTypeEnum,
  })
  referenceType: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  readAt: Date;
}
export const NotificationsSchema = SchemaFactory.createForClass(Notification);
