import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean } from 'class-validator';

export class UpdateCustomerBlockStatusDto {
  @ApiProperty({
    example: true,
    description: 'Set to true to block the customer, false to unblock',
  })
  @IsBoolean()
  isBlocked: boolean;
}
