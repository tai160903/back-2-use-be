import { IsOptional, IsString, IsEnum, IsMongoId } from 'class-validator';

export class UpdateNotificationDto {
  @IsOptional()
  @IsMongoId()
  receiverId?: string;

  @IsOptional()
  @IsEnum(['customer', 'business'])
  receiverType?: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsEnum([
    'borrow',
    'return',
    'penalty',
    'voucher',
    'reward',
    'ranking',
    'eco',
    'manual',
  ])
  type?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsOptional()
  @IsEnum([
    'borrow',
    'return',
    'voucher',
    'policy',
    'eco',
    'wallet',
    'none',
    'feedback',
  ])
  referenceType?: string;

  @IsOptional()
  isRead?: boolean;

  @IsOptional()
  ReadAt?: Date;
}
