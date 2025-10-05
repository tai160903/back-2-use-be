import { Body, Controller, Post } from '@nestjs/common';
import { MailerService } from './mailer.service';
import { MailerDto } from './dto/mailer.dto';

@Controller('mailer')
export class MailerController {
  constructor(private readonly mailerService: MailerService) {}

  @Post('send-test')
  async sendMail(@Body() body: { name: string; email: string }) {
    const mailer: MailerDto = {
      from: `'Back2Use' <l4P2o@example.com>`,
      to: `${body.name} <${body.email}>`,
      subject: 'Test Email from Back2Use',
      html: `<h1>Hello ${body.name}, this is a test email sent from Back2Use application.</h1>`,
    };
    return await this.mailerService.sendMail(mailer);
  }
}
