import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, Max, IsBoolean } from 'class-validator';

export class AdminCreateMaterialDto {
  @ApiProperty({ example: 'PET', description: 'Tên vật liệu' })
  @IsString()
  @IsNotEmpty()
  materialName: string;

  @ApiProperty({ example: 10, description: 'Số lần có thể tái sử dụng' })
  @IsNumber()
  @Min(1)
  reuseLimit: number;

  @ApiProperty({ example: 'Nhựa PET có thể tái sử dụng nhiều lần' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 3.4,
    description: 'Lượng CO₂ phát thải (kg CO₂ trên 1 kg vật liệu)',
  })
  @IsNumber()
  @Min(0)
  co2EmissionPerKg: number;

  @ApiProperty({
    example: true,
    description: 'Vật liệu dùng 1 lần (true) hay tái sử dụng (false)',
  })
  @IsBoolean()
  isSingleUse: boolean;
}
