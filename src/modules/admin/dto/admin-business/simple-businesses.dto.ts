export interface SimpleBusinessDto {
  _id: string;
  userId: string;
  businessName: string;
  businessPhone: string;
  businessAddress: string;
  businessType: string;
  businessLogoUrl: string;
  role: string;
  isActive: boolean;
  isBlocked: boolean;
  createdAt: Date;
  updatedAt: Date;
}
