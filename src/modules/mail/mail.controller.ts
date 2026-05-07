import { Controller, Post, Body, BadRequestException } from '@nestjs/common';
import { MailService } from './mail.service';

@Controller('mail')
export class MailController {
  constructor(private mailService: MailService) {}

  @Post('test')
  async sendTest(@Body() body: { to?: string }) {
    const to = body?.to;
    if (!to) throw new BadRequestException('Missing `to` in body');

    await this.mailService.sendTestEmail(to);

    return { ok: true };
  }
}
