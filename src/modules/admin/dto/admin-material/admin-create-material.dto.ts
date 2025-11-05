import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

export class AdminCreateMaterialDto {
  @ApiProperty({ example: 'Plastic Bottle', description: 'Tên vật liệu' })
  @IsString()
  @IsNotEmpty()
  materialName: string;

  @ApiProperty({ example: 10, description: 'Số lần có thể tái sử dụng' })
  @IsNumber()
  @Min(1)
  reuseLimit: number;

  @ApiProperty({ example: 20, description: 'Tỷ lệ tiền cọc (20%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  depositPercent: number;

  @ApiProperty({ example: 'Nhựa PET có thể tái sử dụng nhiều lần' })
  @IsString()
  @IsNotEmpty()
  description: string;
}
