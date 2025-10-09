import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';

export class UpdateCustomerBlockStatusDto {
  @ApiProperty({
    example: true,
    description: 'Set to true to block the customer, false to unblock',
  })
  @IsBoolean()
  isBlocked: boolean;

  @ApiProperty({
    example: 'Vi phạm điều khoản sử dụng',
    description: 'Reason for blocking or unblocking the customer',
  })
  @IsString()
  @IsNotEmpty({ message: 'Reason is required' })
  reason: string;
}
