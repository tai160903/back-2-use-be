import { registerAs } from '@nestjs/config';

export default registerAs('borrowTransactions', () => ({
  // Number of hours after borrowDate for a 'pending_pickup' transaction to be auto-cancelled
  autoCancelHours: parseInt(process.env.BORROW_AUTO_CANCEL_HOURS || '24', 10),
  // Max concurrent borrow transactions allowed per customer
  maxConcurrentBorrows: parseInt(process.env.BORROW_MAX_CONCURRENT || '3', 10),
  // Cron timezone for schedulers related to borrow transactions (fallback)
  cronTimeZone: process.env.BORROW_CRON_TIMEZONE || 'Asia/Ho_Chi_Minh',
}));
