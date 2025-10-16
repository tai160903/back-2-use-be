export class CreateSubscriptionDto {
  name: string;
  description: string;
  price: number;
  durationInDays: number;
  isActive: boolean;
  isTrail: boolean;
}
