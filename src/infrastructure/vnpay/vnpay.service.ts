import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as qs from 'qs';
import * as moment from 'moment-timezone';
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

    const vnp_Params: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.vnp_TmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: orderId,
      vnp_OrderInfo: orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: amount * 100,
      vnp_ReturnUrl: this.vnp_ReturnUrl,
      vnp_IpAddr: ipAddr,
      vnp_CreateDate: moment().tz('Asia/Ho_Chi_Minh').format('YYYYMMDDHHmmss'),
    };

    const sortedParams = this.sortObject(vnp_Params);
    const signData = qs.stringify(sortedParams, { encode: true });
    const hmac = crypto.createHmac('sha512', this.vnp_HashSecret);
    const secureHash = hmac
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');
    const finalParams = { ...sortedParams, vnp_SecureHash: secureHash };
    const finalQuery = qs.stringify(finalParams, { encode: true });
    console.log('sortedParams', sortedParams);
    console.log('secureHash', secureHash);
    const finalUrl = `${this.vnp_Url}?${finalQuery}`;
    console.log('finalUrl', finalUrl);
    return finalUrl;
  }

  verifyVnpayReturn(query: Record<string, any>): boolean {
    let vnp_Params = { ...query };
    console.log(vnp_Params);
    const receivedHash = vnp_Params['vnp_SecureHash'];

    if (!receivedHash) {
      throw new BadRequestException('Missing vnp_SecureHash in query params');
    }

    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    vnp_Params = this.sortObject(vnp_Params);
    console.log('sortedParams', vnp_Params);

    const signData = qs.stringify(vnp_Params, {
      encode: true,
    });

    const expectedHash = crypto
      .createHmac('sha512', this.vnp_HashSecret)
      .update(Buffer.from(signData, 'utf-8'))
      .digest('hex');

    console.log('expectedHash', expectedHash);
    console.log('receivedHash', receivedHash);

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
