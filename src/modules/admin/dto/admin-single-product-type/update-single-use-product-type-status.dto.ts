import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSingleUseProductTypeStatusDto {
  @ApiProperty({
    example: false,
    description: 'Activate / Deactivate product type',
  })
  @IsBoolean()
  isActive: boolean;
}
