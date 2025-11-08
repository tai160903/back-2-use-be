import { IsInt, IsMongoId, IsNotEmpty, IsString } from 'class-validator';

export class CreateProductSizeDto {
  @IsNotEmpty()
  @IsMongoId()
  productGroupId: string;

  @IsNotEmpty()
  @IsString()
  sizeName: string;

  @IsNotEmpty()
  @IsInt()
  basePrice: number;

  @IsString()
  description?: string;
}
