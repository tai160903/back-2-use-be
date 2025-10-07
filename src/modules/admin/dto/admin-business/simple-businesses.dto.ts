export interface SimpleBusinessDto {
  _id: string;
  userId: string;
  storeName: string;
  storePhone: string;
  storeAddress: string;
  role: string;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}
