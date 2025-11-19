import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString, Min, Max } from 'class-validator';

export class AdminCreateMaterialDto {
  @ApiProperty({ example: 'PET', description: 'Tên vật liệu' })
  @IsString()
  @IsNotEmpty()
  materialName: string;

  @ApiProperty({ example: 10, description: 'Số lần có thể tái sử dụng' })
  @IsNumber()
  @Min(1)
  reuseLimit: number;

  @ApiProperty({ example: 20, description: 'Tỷ lệ tiền cọc (%)' })
  @IsNumber()
  @Min(0)
  @Max(100)
  depositPercent: number;

  @ApiProperty({ example: 'Nhựa PET có thể tái sử dụng nhiều lần' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({
    example: 1,
    description: 'Hệ số quy đổi nhựa (1 = nhựa chuẩn, 0.2 = giấy, ...)',
  })
  @IsNumber()
  @Min(0)
  plasticEquivalentMultiplier: number;

  @ApiProperty({
    example: 3.4,
    description: 'Lượng CO₂ phát thải (kg CO₂ trên 1 kg vật liệu)',
  })
  @IsNumber()
  @Min(0)
  co2EmissionPerKg: number;
}
