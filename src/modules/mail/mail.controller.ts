import { Body, Controller, Post } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private readonly mailService: MailService) {}

  @Post('test')
  async sendTestMail(
    @Body()
    body: {
      email: string;
    },
  ) {
    return this.mailService.sendTestEmail(body.email);
  }

  @Post('send-link')
  async sendLink(
    @Body()
    body: {
      email: string;
      name: string;
      link: string;
    },
  ) {
    return this.mailService.sendRegistrationLink(
      body.email,
      body.name,
      body.link,
    );
  }
}
