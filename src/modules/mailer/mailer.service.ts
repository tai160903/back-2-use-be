import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';
import { MailerDto } from './dto/mailer.dto';

@Injectable()
export class MailerService {
  constructor(private readonly configService: ConfigService) {}

  private getResendClient() {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    return new Resend(apiKey);
  }

  async sendMail(mailer: MailerDto) {
    const { from, to, subject, text, html } = mailer;
    const resend = this.getResendClient();
    const sender =
      from ||
      `${this.configService.get<string>('DEFAULT_FROM_NAME')} <${this.configService.get<string>('DEFAULT_FROM_ADDRESS')}>`;

    // Only support string or string[] for 'to' field
    const toField: string | string[] = to;

    const emailOptions: {
      from: string;
      to: string | string[];
      subject: string;
      text?: string;
      html?: string;
    } = {
      from: sender,
      to: toField,
      subject,
    };
    if (text) emailOptions.text = text;
    if (html) emailOptions.html = html;
    const response = await resend.emails.send(emailOptions);
    return response;
  }
}
