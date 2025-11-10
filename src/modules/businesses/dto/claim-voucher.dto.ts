import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ClaimVoucherDto {
  @ApiPropertyOptional({ description: 'Custom name for business voucher' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  customName?: string;

  @ApiPropertyOptional({
    description: 'Custom description for business voucher',
  })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  customDescription?: string;
}
