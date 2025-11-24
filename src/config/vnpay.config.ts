import { registerAs } from '@nestjs/config';

export default registerAs('vnpay', () => ({
  tmnCode: process.env.VNP_TMN_CODE || '',
  hashSecret: process.env.VNP_HASH_SECRET || '',
  // url: process.env.VNP_URL || 'https://sandbox.vnpayment.vn',
  // returnUrl: process.env.VNP_RETURN_URL || '',
}));
