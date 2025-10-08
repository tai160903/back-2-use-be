import { Controller, Get, Query, Req, Res, Post, Body } from '@nestjs/common';
import { VnpayService } from './vnpay.service';
import { Request, Response } from 'express';

@Controller('vnpay')
export class VnpayController {
  constructor(private readonly vnpayService: VnpayService) {}

  @Post('create-payment')
  async createPayment(@Body() body: any, @Req() req: Request) {
    const { orderId, amount, orderInfo } = body;

    const ipAddr =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      '';

    const paymentUrl = this.vnpayService.createPaymentUrl(
      orderId,
      amount,
      ipAddr,
      orderInfo,
    );

    return { url: paymentUrl };
  }

  @Get('return')
  async vnpayReturn(
    @Query() query: Record<string, string>,
    @Res() res: Response,
  ) {
    try {
      const isValid = await this.vnpayService.verifyVnpayReturn(query);

      if (isValid) {
        return res.redirect(
          `${process.env.CLIENT_RETURN_URL}?status=success&orderId=${query['vnp_TxnRef']}`,
        );
      } else {
        return res.redirect(`${process.env.CLIENT_RETURN_URL}?status=fail`);
      }
    } catch (error) {
      console.error('VNPay Return Error:', error);
      return res.redirect(`${process.env.CLIENT_RETURN_URL}?status=error`);
    }
  }
}
