import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSingleUseProductTypeDto {
  @ApiProperty({
    example: 'Ly nhựa lạnh',
    description: 'Tên loại sản phẩm dùng 1 lần',
  })
  @IsString()
  @IsNotEmpty()
  name: string;
}
