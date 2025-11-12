export enum VouchersStatus {
  TEMPLATE = 'template', // Admin tạo, business chưa claim
  CLAIMED = 'claimed', // Business đã claim, chưa set ngày
  INACTIVE = 'inactive', // Có ngày nhưng chưa tới hạn
  ACTIVE = 'active', // Đang hiệu lực
  EXPIRED = 'expired', // Hết hạn
}
