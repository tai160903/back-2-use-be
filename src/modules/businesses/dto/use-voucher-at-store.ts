import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class UseVoucherAtStoreDto {
  @ApiProperty({ example: 'ABC123XYZ', description: 'Full voucher code' })
  @IsString()
  @MinLength(1)
  code: string;
}
