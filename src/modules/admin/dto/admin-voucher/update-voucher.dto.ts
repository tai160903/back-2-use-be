import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateVoucherDto {
  @ApiProperty({
    example: true,
    type: Boolean,
  })
  @IsNotEmpty()
  @IsBoolean()
  isDisabled: boolean;
}
