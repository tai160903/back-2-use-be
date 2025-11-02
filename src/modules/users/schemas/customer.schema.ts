import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomersDocument = HydratedDocument<Customers>;

@Schema({ timestamps: true, minimize: false })
export class Customers {
  @Prop({ required: true, unique: true, ref: 'Users' })
  userId: Types.ObjectId;

  @Prop()
  fullName: string;

  @Prop({ trim: true })
  phone: string;

  @Prop({ trim: true })
  address: string;

  @Prop()
  yob: Date;

  @Prop({ default: 0 })
  rankingPoints: number;

  @Prop({ default: 0 })
  rewardPoints: number;

  @Prop({ default: 0 })
  returnSuccessCount: number;
}

export const CustomersSchema = SchemaFactory.createForClass(Customers);
