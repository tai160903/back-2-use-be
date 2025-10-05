import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Types } from 'mongoose';

export class CreateMaterialDto {
  @ApiProperty({ required: true, example: 'Plastic' })
  @IsNotEmpty()
  @IsString()
  materialName: string;

  @ApiProperty({ required: true, example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  maximumReuse: number;

  @ApiProperty({
    required: true,
    example: 'Durable and lightweight plastic material',
  })
  @IsNotEmpty()
  @IsString()
  description: string;
}
