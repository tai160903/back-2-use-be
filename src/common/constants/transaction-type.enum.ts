export enum TransactionType {
  TOP_UP = 'top_up', // Nạp tiền
  WITHDRAWAL = 'withdrawal', // Rút tiền
  BORROW_DEPOSIT = 'borrow_deposit', // Đặt cọc khi mượn
  RETURN_REFUND = 'return_refund', // Hoàn cọc khi trả
  SUBSCRIPTION_FEE = 'subscription_fee', // Trừ phí gói dịch vụ
  PENALTY = 'penalty', // Phạt (mất, trễ, hư,...)
  DEPOSIT_FORFEITED = 'deposit_forfeited',
}
