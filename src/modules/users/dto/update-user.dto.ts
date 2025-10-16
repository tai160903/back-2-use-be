import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  @ApiPropertyOptional({ example: 'John Doe' })
  fullName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^0\d{9}$/, { message: 'Invalid phone number format' })
  @ApiPropertyOptional({ example: '0987654321' })
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  @ApiPropertyOptional({ example: '123 Street' })
  address?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ type: String, format: 'date', example: '1990-01-01' })
  yob?: Date;
}
