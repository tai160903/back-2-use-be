import { IsNotEmpty, IsMongoId, IsString, IsOptional } from 'class-validator';

export class CreateProductGroupDto {
  @IsNotEmpty()
  @IsMongoId()
  materialId: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;
}
