import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { MaterialRequestStatus } from 'src/common/constants/material-request-status.enum';

export type MaterialRequestDocument = HydratedDocument<MaterialRequests>;

@Schema({ timestamps: true })
export class MaterialRequests {
  @Prop({ type: Types.ObjectId, ref: 'Businesses', required: true })
  businessId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Material' })
  approvedMaterialId?: Types.ObjectId;

  @Prop({ type: String, required: true })
  requestedMaterialName: string;

  @Prop({ type: String })
  description: string;

  @Prop({
    type: String,
    enum: Object.values(MaterialRequestStatus),
    default: MaterialRequestStatus.PENDING,
  })
  status: MaterialRequestStatus;

  @Prop({ type: String })
  adminNote?: string;
}

export const MaterialRequestSchema =
  SchemaFactory.createForClass(MaterialRequests);
