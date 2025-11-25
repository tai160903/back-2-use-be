import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsNumber, Min } from 'class-validator';

export enum PaymentMethod {
  VNPAY = 'vnpay',
  MOMO = 'momo',
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
}
