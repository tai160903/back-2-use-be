import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Types } from 'mongoose';

export class CreateNotificationDto {
  @IsMongoId()
  receiverId: Types.ObjectId;

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
  referenceId?: Types.ObjectId;

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
