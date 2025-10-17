import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty({ message: 'Username is required' })
  @Length(6, 20, { message: 'Username must be between 6 and 20 characters' })
  @Matches(/^(?![_.-])(?!.*[_.-]{2})[a-zA-Z0-9._-]+(?<![_.-])$/, {
    message:
      'Use only letters, numbers, dots, hyphens, or underscores; cannot start/end with a special character or have two special characters in a row.',
  })
  username: string;

  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
