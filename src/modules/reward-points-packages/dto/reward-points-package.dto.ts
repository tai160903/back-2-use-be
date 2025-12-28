import { Prop } from '@nestjs/mongoose';

export class RewardPointsPackageDto {
  @Prop()
  _id: string;

  @Prop()
  name: string;

  @Prop()
  points: number;

  @Prop()
  price: number;

  @Prop()
  description: string;

  @Prop()
  isActive: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;
}
