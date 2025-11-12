// src/modules/eco-reward-policies/schemas/eco-reward-policy.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type EcoRewardPolicyDocument = HydratedDocument<EcoRewardPolicy>;

@Schema({ timestamps: true })
export class EcoRewardPolicy {
  @Prop({ required: true })
  threshold: number;

  @Prop({ required: true })
  label: string;

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const EcoRewardPolicySchema =
  SchemaFactory.createForClass(EcoRewardPolicy);
