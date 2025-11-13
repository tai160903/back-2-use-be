import { IsEnum, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsString()
  @IsEnum(['customer', 'business'])
  type: 'customer' | 'business';
}
