import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum RequestDecision {
  APPROVE = 'approved',
  REJECT = 'rejected',
}

export class ReviewMaterialRequestDto {
  @ApiProperty({
    description:
      'Decision of the admin: approve or reject the material request.',
    enum: RequestDecision,
    example: RequestDecision.REJECT,
  })
  @IsEnum(RequestDecision)
  decision: RequestDecision;

  @ApiPropertyOptional({
    description:
      'Reason for rejection. Required only when decision = rejected.',
    example: 'Material name duplicates an existing entry.',
  })
  @ValidateIf((o) => o.decision === RequestDecision.REJECT)
  @IsNotEmpty({ message: 'adminNote is required when rejecting' })
  @IsString()
  adminNote?: string;

  @ApiPropertyOptional({
    description:
      'Extra data required when approving a new material (reuseLimit, depositPercent)',
    example: { reuseLimit: 3, depositPercent: 10 },
  })
  @ValidateIf((o) => o.decision === RequestDecision.APPROVE)
  @IsNotEmpty({ message: 'Material details are required when approving' })
  materialData?: {
    reuseLimit: number;
    depositPercent: number;
  };
}
