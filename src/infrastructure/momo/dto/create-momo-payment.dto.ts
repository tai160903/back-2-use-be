import { IsMongoId, IsInt, Min } from 'class-validator';

export class CreateMomoPaymentDto {
  @IsMongoId()
  walletId: string;

  @IsInt()
  @Min(1000)
  amount: number; // VND
}
