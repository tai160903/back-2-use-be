import { Prop } from '@nestjs/mongoose';

export class BaseBusinessFields {
  @Prop({ required: true })
  storeName: string;

  @Prop({ required: true })
  storeAddress: string;

  @Prop({ required: true })
  storePhone: string;

  @Prop({ required: true })
  taxCode: string;

  @Prop({ required: true })
  foodLicenseUrl: string;

  @Prop({ required: true })
  businessLicenseUrl: string;
}
