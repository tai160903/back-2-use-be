import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { Types } from 'mongoose';

export class CreateMaterialDto {
  @ApiProperty({ example: 'Glass Bottle', description: 'Tên vật liệu' })
  @IsString()
  @IsNotEmpty()
  materialName: string;

  @ApiProperty({
    example: 'Tái sử dụng được nhiều lần, thân thiện với môi trường',
  })
  @IsString()
  @IsNotEmpty()
  description: string;
}
