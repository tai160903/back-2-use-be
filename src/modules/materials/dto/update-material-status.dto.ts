import { IsEnum, IsOptional, IsString, ValidateIf } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { MaterialStatus } from 'src/common/constants/material-status.enum';

export class UpdateMaterialStatusDto {
  @ApiProperty({
    description:
      'Status of the material. Must be either "approved" or "rejected".',
    enum: [MaterialStatus.APPROVED, MaterialStatus.REJECTED],
    example: MaterialStatus.REJECTED,
  })
  @IsEnum([MaterialStatus.APPROVED, MaterialStatus.REJECTED])
  status: MaterialStatus;

  @ApiPropertyOptional({
    description:
      'Reason for rejection. This field is required only when the status is "rejected". Leave it empty if the material is approved.',
    example:
      'The quality does not meet the required standards. (Leave empty if approved)',
  })
  @ValidateIf((o) => o.status === MaterialStatus.REJECTED)
  @IsString()
  rejectReason: string;
}
