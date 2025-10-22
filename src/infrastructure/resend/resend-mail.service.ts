import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { Resend } from 'resend';

@Injectable()
export class ResendMailService {
  private resend: Resend;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
  }

  async sendMail(to: string, subject: string, html: string) {
    try {
      const result = await this.resend.emails.send({
        from: 'Back2Use <onboarding@resend.dev>',
        to,
        subject,
        html,
      });
      console.log('✅ Email sent successfully:', result);
      return result;
    } catch (error) {
      console.error('❌ Failed to send email via Resend:', error);
      throw new HttpException(
        error.message || 'Failed to send email',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
