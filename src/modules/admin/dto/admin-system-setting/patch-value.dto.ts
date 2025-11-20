import { IsString, IsNotEmpty, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PatchValueDto {
  @ApiProperty({
    description: 'Tên của field bên trong object "value" mà bạn muốn cập nhật',
    example: 'rewardLate',
  })
  @IsString()
  @IsNotEmpty()
  path: string;

  @ApiProperty({
    description:
      'Giá trị mới của field này. Có thể là number, string, boolean, hoặc object tuỳ theo policy.',
    example: 10,
  })
  @IsNotEmpty()
  value: any;
}
