export class MailerDto {
  from?: string;
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  placeholder?: Record<string, string>;
}
