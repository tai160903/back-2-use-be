import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CustomersDocument = HydratedDocument<Customers>;

@Schema({ timestamps: true })
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

  @Prop()
  legitPoints: number;

  @Prop()
  rewardPoints: number;
}

export const CustomersSchema = SchemaFactory.createForClass(Customers);
