import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as qs from 'qs';
import { ProductCode, dateFormat } from 'vnpay';
@Injectable()
export class VnpayService {
  private vnp_TmnCode: string;
  private vnp_HashSecret: string;
  private vnp_Url: string;
  private vnp_ReturnUrl: string;

  constructor(private readonly configService: ConfigService) {
    const vnpayConfig = this.configService.get('vnpay');

    if (!vnpayConfig)
      throw new Error('VNPay config not found in environment variables');
    this.vnp_TmnCode = vnpayConfig.tmnCode;
    this.vnp_HashSecret = vnpayConfig.hashSecret;
    this.vnp_Url =
      vnpayConfig.url || 'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html';
    this.vnp_ReturnUrl = vnpayConfig.returnUrl;

    console.log(vnpayConfig);
  }

  createPaymentUrl(
    orderId: string,
    amount: number,
    ipAddr: string,
    orderInfo: string,
  ): string {
    if (!orderId) {
      throw new BadRequestException('orderId is required');
    }
    if (!amount || amount <= 0) {
      throw new BadRequestException('Amount must be greater than 0');
    }
    const date = new Date();
    const tzOffset = 7 * 60 * 60 * 1000; // VN timezone
    const vnTime = new Date(date.getTime() + tzOffset);

    const vnp_Params: Record<string, string | number> = {
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_Amount: Math.round(amount * 100),
      vnp_CurrCode: 'VND',
      vnp_IpAddr: ipAddr,
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_Locale: 'vn',
      vnp_CreateDate: dateFormat(vnTime, 'yyyyMMddHHmmss'),
      vnp_ExpireDate: dateFormat(
        new Date(vnTime.getTime() + 15 * 60 * 1000),
        'yyyyMMddHHmmss',
      ), // 15 minutes expiration
    };

    const sortedParams = this.sortObject(vnp_Params);
    console.log('VNPay Sorted Params:', sortedParams);
    const signData = qs.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret.trim());
    const secureHash = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    const querystring = qs.stringify(sortedParams, { encode: true });

    return `${this.vnp_Url}?${querystring}&vnp_SecureHash=${secureHash}`;
  }

  verifyVnpayReturn(query: Record<string, any>): boolean {
    const vnp_Params = { ...query };
    const receivedHash = vnp_Params['vnp_SecureHash'];

    if (!receivedHash) {
      throw new BadRequestException('Missing vnp_SecureHash in query params');
    }

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const signData = qs.stringify(this.sortObject(vnp_Params), {
      encode: false,
    });

    const expectedHash = crypto
      .createHmac('sha512', this.vnp_HashSecret)
      .update(signData)
      .digest('hex');

    return expectedHash === receivedHash;
  }

  private sortObject(obj: Record<string, any>): Record<string, any> {
    return Object.keys(obj)
      .sort()
      .reduce(
        (sorted, key) => {
          sorted[key] = obj[key];
          return sorted;
        },
        {} as Record<string, any>,
      );
  }
}
