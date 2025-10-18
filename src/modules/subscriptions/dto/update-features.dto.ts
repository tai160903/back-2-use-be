import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString, ArrayNotEmpty } from 'class-validator';

export class UpdateFeaturesDto {
  @ApiProperty({
    description: 'Danh sách tính năng của gói subscription',
    example: [
      'Quản lý nhân viên và chi nhánh',
      'Thống kê doanh số theo thời gian thực',
      'Phân quyền người dùng chi tiết',
      'Báo cáo tài chính tổng hợp',
      'Hỗ trợ tích hợp API với phần mềm kế toán',
    ],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  features: string[];
}
