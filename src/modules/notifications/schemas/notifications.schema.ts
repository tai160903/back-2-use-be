import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, ref: 'User' })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({
    required: true,
    enum: ['borrow', 'return', 'wallet', 'system', 'feedback'],
  })
  type: string;

  @Prop({ default: false })
  isRead: boolean;
}
export const NotificationsSchema = SchemaFactory.createForClass(Notification);
