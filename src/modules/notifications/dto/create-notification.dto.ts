import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsEnum,
  IsOptional,
} from 'class-validator';

export class CreateNotificationDto {
  @IsMongoId()
  receiverId: string;

  // @IsEnum(['customer', 'business'])
  // receiverType: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

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
  type: string;

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
    'subscription',
    'none',
    'feedback',
  ])
  referenceType?: string;
}
