import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Users } from './users.schema';

export type UserBlockHistoryDocument = HydratedDocument<UserBlockHistory>;

@Schema({ timestamps: true })
export class UserBlockHistory {
  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  isBlocked: boolean;

  @Prop({ type: Types.ObjectId, ref: 'Users', required: true })
  blockBy: Types.ObjectId;
}

export const UserBlockHistorySchema =
  SchemaFactory.createForClass(UserBlockHistory);
