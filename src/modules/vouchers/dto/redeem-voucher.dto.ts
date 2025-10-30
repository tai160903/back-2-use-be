// dto/customer-voucher/redeem-voucher.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId, IsNotEmpty } from 'class-validator';

export class RedeemVoucherDto {
  @ApiProperty({ example: '672c89fcf2a4c3d2f15a9e34' })
  @IsMongoId()
  @IsNotEmpty()
  voucherId: string;
}
