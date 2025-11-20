import { IsOptional, IsString, IsObject } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateSystemSettingDto {
  @ApiPropertyOptional({
    description:
      'Giá trị mới cho cấu hình (chỉ cập nhật các field được gửi lên)',
    example: {
      rewardSuccess: 20,
      rewardLate: 10,
    },
  })
  @IsObject()
  @IsOptional()
  value?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Mô tả mới cho setting',
    example: 'Updated reward policy for testing',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
