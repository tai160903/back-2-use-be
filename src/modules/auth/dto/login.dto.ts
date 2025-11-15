import { IsEnum, IsString } from 'class-validator';

export class LoginDto {
  @IsString()
  username: string;

  @IsString()
  password: string;

  @IsEnum(['customer', 'business'])
  type: 'customer' | 'business';
}
