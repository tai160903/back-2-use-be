import { IsNotEmpty, IsString, IsMongoId, IsEnum } from 'class-validator';

export class CreateNotificationDto {
  @IsMongoId()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(['borrow', 'return', 'wallet', 'system', 'feedback'])
  type: string;
}
