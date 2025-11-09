import { VoucherType } from 'src/common/constants/voucher-types.enum';
import { VouchersStatus } from 'src/common/constants/vouchers-status.enum';
import { Vouchers } from 'src/modules/vouchers/schema/vouchers.schema';

export function getAllowedVoucherUpdateFields(voucher: Vouchers): string[] {
  const now = new Date();

  switch (voucher.voucherType) {
    case VoucherType.BUSINESS:
      return ['isDisabled'];

    case VoucherType.SYSTEM:
      if (
        voucher.status === VouchersStatus.INACTIVE &&
        voucher.startDate &&
        voucher.startDate > now
      ) {
        // System voucher chưa hiệu lực => có thể chỉnh hầu hết thông tin
        return [
          'name',
          'description',
          'discountPercent',
          'baseCode',
          'rewardPointCost',
          'maxUsage',
          'startDate',
          'endDate',
          'isDisabled',
        ];
      }

      if (voucher.status === VouchersStatus.ACTIVE) {
        // Đang hiệu lực chỉ cho disable
        return ['isDisabled'];
      }

      return []; // Các trạng thái khác không cho update

    case VoucherType.LEADERBOARD:
      return []; // Leaderboard voucher không bao giờ được chỉnh

    default:
      return [];
  }
}
