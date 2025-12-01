import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as https from 'https';

interface CreateMomoPaymentParams {
  amount: number; // VND
  orderId: string; // internal transaction id
  orderInfo: string; // description
  redirectUrl: string; // client redirect handler
  ipnUrl: string; // server ipn url if needed
}

@Injectable()
export class MomoService {
  async createPaymentUrl(params: CreateMomoPaymentParams) {
    try {
      if (!params.amount || params.amount <= 0) {
        throw new BadRequestException('Amount must be greater than 0');
      }
      if (!params.orderId) {
        throw new BadRequestException('orderId is required');
      }

      const accessKey = process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85';
      const secretKey =
        process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
      const partnerCode = process.env.MOMO_PARTNER_CODE || 'MOMO';

      const requestType = 'payWithMethod';

      const requestId = params.orderId; // reuse internal id
      const extraData = '';
      const autoCapture = true;
      const lang = 'vi';
      const orderGroupId = '';
      const amountStr = String(params.amount);

      const rawSignature =
        'accessKey=' +
        accessKey +
        '&amount=' +
        amountStr +
        '&extraData=' +
        extraData +
        '&ipnUrl=' +
        params.ipnUrl +
        '&orderId=' +
        params.orderId +
        '&orderInfo=' +
        params.orderInfo +
        '&partnerCode=' +
        partnerCode +
        '&redirectUrl=' +
        params.redirectUrl +
        '&requestId=' +
        requestId +
        '&requestType=' +
        requestType;

      const signature = crypto
        .createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

      const requestBody = JSON.stringify({
        partnerCode,
        partnerName: 'Test',
        storeId: 'MomoTestStore',
        requestId,
        amount: amountStr,
        orderId: params.orderId,
        orderInfo: params.orderInfo,
        redirectUrl: params.redirectUrl,
        ipnUrl: params.ipnUrl,
        lang,
        requestType,
        autoCapture,
        extraData,
        orderGroupId,
        signature,
      });

      const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(requestBody),
        },
      };

      const response = await new Promise<Record<string, any>>(
        (resolve, reject) => {
          const req = https.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
              data += chunk;
            });
            res.on('end', () => {
              try {
                const parsed: Record<string, any> = JSON.parse(data) as Record<
                  string,
                  any
                >;
                resolve(parsed);
              } catch (error) {
                reject(
                  error instanceof Error ? error : new Error(String(error)),
                );
              }
            });
          });
          req.on('error', (e) =>
            reject(e instanceof Error ? e : new Error(String(e))),
          );
          req.write(requestBody);
          req.end();
        },
      );

      return response;
    } catch (error) {
      throw new HttpException(
        (error as Error).message || 'MoMo create payment error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  verifyMomoReturn(query: Record<string, string>) {
    if (!query) {
      throw new BadRequestException('Missing momo query parameters');
    }

    console.log(query);

    console.log('aaa');

    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
    } = query;

    const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';

    const rawSignature =
      'accessKey=' +
      (process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85') +
      '&amount=' +
      amount +
      '&extraData=' +
      extraData +
      '&message=' +
      message +
      '&orderId=' +
      orderId +
      '&orderInfo=' +
      orderInfo +
      '&orderType=' +
      orderType +
      '&partnerCode=' +
      partnerCode +
      '&payType=' +
      payType +
      '&requestId=' +
      requestId +
      '&responseTime=' +
      responseTime +
      '&resultCode=' +
      resultCode +
      '&transId=' +
      transId;

    const signCheck = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const isSignatureValid = signCheck === signature;
    const isSuccess = isSignatureValid && resultCode === '0';

    return {
      isSuccess,
      message: isSuccess
        ? 'Payment successful'
        : isSignatureValid
          ? 'Payment failed'
          : 'Invalid signature',
    };
  }
}
