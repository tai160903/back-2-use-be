import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, Min, IsOptional } from 'class-validator';

export enum PaymentMethod {
  VNPAY = 'vnpay',
  MOMO = 'momo',
}

export enum Platform {
  WEB = 'web',
  MOBILE = 'mobile',
}

export class DepositWalletDto {
  @ApiProperty({
    description: 'Amount to deposit in VND',
    example: 100000,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1, { message: 'Amount must be greater than 0' })
  amount: number;

  @ApiProperty({
    description: 'Payment method to use',
    enum: PaymentMethod,
    example: PaymentMethod.VNPAY,
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod, {
    message: 'Payment method must be either vnpay or momo',
  })
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Platform making the request (web or mobile)',
    enum: Platform,
    example: Platform.WEB,
    required: false,
  })
  @IsOptional()
  @IsEnum(Platform, {
    message: 'Platform must be either web or mobile',
  })
  platform?: Platform;
}
