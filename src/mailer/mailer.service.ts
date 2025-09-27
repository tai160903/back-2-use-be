import { ConfigService } from '@nestjs/config';
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { MailerDto } from './dto/mailer.dto';

@Injectable()
export class MailerService {
  constructor(private readonly configService: ConfigService) {}
  mailTransport() {
    const transport = nodemailer.createTransport({
      host: this.configService.get('MAIL_HOST'),
      port: this.configService.get('MAIL_PORT'),
      secure: true,
      auth: {
        user: this.configService.get('MAIL_USER'),
        pass: this.configService.get('MAIL_PASS'),
      },
    });
    return transport;
  }

  async sendMail(mailer: MailerDto) {
    const { from, to, subject, text, html } = mailer;
    const transporter = this.mailTransport();
    const options = {
      from:
        from ||
        `"${this.configService.get<string>('DEFAULT_FROM_NAME')}" <${this.configService.get<string>('DEFAULT_FROM_ADDRESS')}>`,
      to,
      subject,
      text,
      html,
    };
    const info = await transporter.sendMail(options);
    return info;
  }
}
