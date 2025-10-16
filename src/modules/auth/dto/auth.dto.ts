import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';

export class AuthDto {
  @ApiProperty({ required: true, example: 'johndoe' })
  @IsString()
  @Matches(/^(?![_.-])(?!.*[_.-]{2})[a-zA-Z0-9._-]{6,40}(?<![_.-])$/, {
    message:
      'Use only letters, numbers, dots, hyphens, or underscores. Cannot start or end with a special character',
  })
  @MinLength(6, { message: 'Username must be at least 6 characters long' })
  @MaxLength(20, { message: 'Username must be at most 20 characters long' })
  username: string;

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
}
