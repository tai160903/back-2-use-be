import {
  IsInt,
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsOptional,
  IsNumber,
  Min,
} from 'class-validator';

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

  @IsOptional()
  @IsNumber({}, { message: 'Weight must be a number' })
  @Min(0, { message: 'Weight must be non-negative' })
  weight?: number;
}
