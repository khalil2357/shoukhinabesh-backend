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

  @Post('send-otp')
  async sendOtp(
    @Body()
    body: {
      email: string;
      name: string;
      otp: string;
    },
  ) {
    return this.mailService.sendRegistrationOtp(
      body.email,
      body.name,
      body.otp,
    );
  }
}
