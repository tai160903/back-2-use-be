// dto/customer-voucher/redeem-voucher.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsNotEmpty, IsString } from 'class-validator';
import { VoucherCodeType } from 'src/common/constants/voucher-codes-types.enum';

export class RedeemVoucherDto {
  @ApiProperty({ example: '672c89fcf2a4c3d2f15a9e34' })
  @IsMongoId()
  voucherId: string;

  @ApiProperty({
    description: 'voucher type business or leaderboard',
    example: VoucherCodeType.BUSINESS,
  })
  @IsEnum(VoucherCodeType)
  @IsNotEmpty()
  voucherType: VoucherCodeType;
}
