import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  VNPay,
  ignoreLogger,
  HashAlgorithm,
  ReturnQueryFromVNPay,
  consoleLogger,
} from 'vnpay';

@Injectable()
export class VnpayService {
  private vnpay: VNPay;
  constructor(private configService: ConfigService) {
    this.vnpay = new VNPay({
      tmnCode: this.configService.get<string>('vnpay.tmnCode') || '',
      secureSecret: this.configService.get<string>('vnpay.hashSecret') || '',
      vnpayHost: 'https://sandbox.vnpayment.vn',
      testMode: true,
      hashAlgorithm: HashAlgorithm.SHA512,
      enableLog: true,
      loggerFn: ignoreLogger,
    });
  }
  createPaymentUrl(params: {
    vnp_Amount: number;
    vnp_ReturnUrl: string;
    vnp_TxnRef: string;
    vnp_OrderInfo: string;
  }): string {
    if (!params.vnp_TxnRef)
      throw new BadRequestException('OrderId (vnp_TxnRef) is required');
    if (!params.vnp_Amount || params.vnp_Amount <= 0)
      throw new BadRequestException('Amount must be > 0');

    const url = this.vnpay.buildPaymentUrl(
      {
        vnp_Amount: params.vnp_Amount,
        vnp_IpAddr: '127.0.0.1',
        vnp_ReturnUrl: params.vnp_ReturnUrl,
        vnp_TxnRef: params.vnp_TxnRef,
        vnp_OrderInfo: params.vnp_OrderInfo,
      },
      {
        logger: {
          type: 'all',
          loggerFn: consoleLogger,
        },
      },
    );
    return url;
  }

  verifyVnpayReturn(query: ReturnQueryFromVNPay): {
    isSuccess: boolean;
    message: string;
  } {
    if (!query) {
      throw new BadRequestException('Missing query parameters');
    }

    const verify = this.vnpay.verifyReturnUrl(query);
    console.log(verify);
    return verify;
  }
}
