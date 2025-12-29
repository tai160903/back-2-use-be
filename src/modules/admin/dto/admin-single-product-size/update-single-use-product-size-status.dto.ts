import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateSingleUseProductSizeStatusDto {
  @ApiProperty({
    example: false,
    description: 'Activate / Deactivate single-use product size',
  })
  @IsBoolean()
  isActive: boolean;
}
