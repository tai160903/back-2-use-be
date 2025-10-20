import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type WalletsDocument = HydratedDocument<Wallets>;

@Schema({ timestamps: true })
export class Wallets {
  @Prop({ type: Types.ObjectId, required: true, unique: true, ref: 'Users' })
  userId: Types.ObjectId;

  @Prop({ required: true, default: 0 })
  balance: number;
}

export const WalletsSchema = SchemaFactory.createForClass(Wallets);
