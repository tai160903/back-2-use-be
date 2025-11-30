import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { UserType } from 'src/common/constants/user-type.enum';

export type WalletsDocument = HydratedDocument<Wallets>;

@Schema({ timestamps: true })
export class Wallets {
  @Prop({ type: Types.ObjectId, required: true, ref: 'Users' })
  userId: Types.ObjectId;

  @Prop({ required: true, enum: UserType })
  type: string;

  @Prop({ required: true, default: 0 })
  availableBalance: number;

  @Prop({ required: true, default: 0 })
  holdingBalance: number;
}

export const WalletsSchema = SchemaFactory.createForClass(Wallets);

// WalletsSchema.index({ userId: 1, type: 1 }, { unique: true });
