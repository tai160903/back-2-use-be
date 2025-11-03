import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class UpdateBusinessDto {
  @ApiPropertyOptional({
    description: 'Business name',
    example: 'ABC Store',
    minLength: 3,
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  businessName?: string;

  @ApiPropertyOptional({
    description: 'Business address',
    example: '123 Main Street, City',
  })
  @IsOptional()
  @IsString()
  businessAddress?: string;

  @ApiPropertyOptional({
    description: 'Business phone number',
    example: '0901234567',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{10}$/, {
    message: 'Phone number must be 10 digits',
  })
  businessPhone?: string;

  @ApiPropertyOptional({
    description: 'Business type',
    example: 'Restaurant',
  })
  @IsOptional()
  @IsString()
  businessType?: string;

  @ApiPropertyOptional({
    description: 'Opening time',
    example: '08:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format',
  })
  openTime?: string;

  @ApiPropertyOptional({
    description: 'Closing time',
    example: '22:00',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Time must be in HH:MM format',
  })
  closeTime?: string;
}
