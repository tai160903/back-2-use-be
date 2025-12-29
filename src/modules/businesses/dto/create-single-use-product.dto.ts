import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSingleUseProductDto {
  @ApiProperty()
  @IsMongoId()
  productTypeId: string;

  @ApiProperty()
  @IsMongoId()
  productSizeId: string;

  @ApiProperty()
  @IsMongoId()
  materialId: string;

  @ApiProperty()
  @IsString()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Weight in gram' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight: number;
}
