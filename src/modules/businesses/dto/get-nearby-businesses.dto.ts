import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, Min } from 'class-validator';

export class GetNearbyBusinessesDto {
  @ApiPropertyOptional({
    example: 106.636654,
    description: 'Longitude (kinh độ)',
  })
  @Type(() => Number)
  @IsNumber()
  longitude: number;

  @ApiPropertyOptional({ example: 10.820578, description: 'Latitude (vĩ độ)' })
  @Type(() => Number)
  @IsNumber()
  latitude: number;

  @ApiPropertyOptional({
    example: 2000,
    description: 'Bán kính tìm kiếm (mét)',
    default: 2000,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  radius?: number = 2000;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number for pagination',
    default: 1,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 10,
    description: 'Number of items per page',
    default: 10,
  })
  @Type(() => Number)
  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;
}
