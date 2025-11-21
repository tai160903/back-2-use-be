import { HydratedDocument, Types } from 'mongoose';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
export type NotificationDocument = HydratedDocument<Notification>;

@Schema({ timestamps: true })
export class Notification {
  @Prop({ required: true, ref: 'User' })
  receiverId: Types.ObjectId;

  // @Prop({ enum: ['customer', 'business'], required: true })
  // receiverType: string;

  @Prop({
    enum: [
      'borrow',
      'return',
      'penalty',
      'voucher',
      'reward',
      'ranking',
      'eco',
      'manual',
    ],
  })
  type: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  message: string;

  @Prop({})
  referenceId: string;

  @Prop({
    enum: [
      'borrow',
      'return',
      'voucher',
      'policy',
      'eco',
      'wallet',
      'subscription',
      'none',
      'feedback',
    ],
  })
  referenceType: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop()
  ReadAt: Date;
}
export const NotificationsSchema = SchemaFactory.createForClass(Notification);
