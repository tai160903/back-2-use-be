import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { MaterialStatus } from '../schemas/material.schema';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMaterialStatusDto {
  @ApiProperty({
    description: 'Material status, can only choose Approved or Rejected',
    enum: [MaterialStatus.APPROVED, MaterialStatus.REJECTED],
    example: MaterialStatus.APPROVED,
  })
  @IsEnum([MaterialStatus.APPROVED, MaterialStatus.REJECTED])
  status: MaterialStatus;

  @ApiPropertyOptional({
    description: 'Note when rejected material',
    example: 'Quality not required, if approved dont need reject reason',
  })
  @ValidateIf((o) => o.status === MaterialStatus.REJECTED)
  @IsString()
  rejectReason: string;
}
