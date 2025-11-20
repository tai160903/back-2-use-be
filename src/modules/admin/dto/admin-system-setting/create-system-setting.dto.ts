import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateSystemSettingDto {
  @ApiProperty({
    description: 'Nhóm của setting, giúp phân loại các cấu hình hệ thống',
    example: 'reward',
  })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({
    description: 'Tên key duy nhất trong cùng category',
    example: 'reward_policy',
  })
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty({
    description: 'Giá trị cấu hình (dạng object tùy biến)',
    example: {
      rewardSuccess: 15,
      rewardLate: 7,
      rewardFailed: 0,
      rankingSuccess: 15,
      rankingLate: 7,
      rankingFailedPenalty: -15,
    },
  })
  @IsObject()
  @IsNotEmpty()
  value: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Mô tả chi tiết về setting',
    example: 'Reward policy for borrow-return',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
