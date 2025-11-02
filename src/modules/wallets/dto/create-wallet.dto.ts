export class CreateWalletDto {
  userId: string;
  type: 'customer' | 'business';
  availableBalance: number;
  holdingBalance: number;
}
