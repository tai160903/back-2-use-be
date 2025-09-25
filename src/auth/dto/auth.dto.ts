import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  IsOptional,
  MinLength,
  MaxLength,
} from 'class-validator';

export class AuthDto {
  @ApiProperty({ required: true, example: 'John Doe' })
  @IsString()
  name: string;

  @ApiProperty({ required: true, example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ required: true, example: 'password123' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @MaxLength(20, { message: 'Password must be at most 20 characters long' })
  password: string;

  @ApiProperty({ required: true, example: 'password123' })
  @IsString()
  confirmPassword?: string;

  @ApiProperty({ required: true, example: '1234567890' })
  @IsString()
  phone: string;

  @ApiProperty({ required: false, example: '123 Main St, City, Country' })
  @IsOptional()
  @IsString()
  address?: string;

  @ApiProperty({ required: false, example: '1990-01-01' })
  @IsOptional()
  @IsString()
  yob?: Date;
}
