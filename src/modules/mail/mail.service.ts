import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo>;

  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpPort =
      Number(this.config.get<string>('SMTP_PORT')) || 465;

    const smtpUser =
      this.config.get<string>('SMTP_USER');

    const smtpPass = this.config
      .get<string>('SMTP_PASS')
      ?.replace(/\s+/g, '');

    this.fromEmail =
      this.config.get<string>('EMAIL_FROM') ||
      smtpUser!;

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
      tls: {
        rejectUnauthorized: false,
      },
      connectionTimeout: 10000,
      socketTimeout: 10000,
    });

    this.transporter
      .verify()
      .then(() => {
        this.logger.log(
          `SMTP Ready (${smtpHost}:${smtpPort})`,
        );
      })
      .catch((err) => {
        this.logger.error(
          'SMTP Verify Failed: ' +
            this.getErrorMessage(err),
        );
      });
  }

  async sendPasswordResetOtp(
    email: string,
    name: string,
    otp: string,
  ) {
    await this.sendEmail({
      to: email,
      subject: 'Reset Your Password',
      html: this.otpTemplate(name, otp),
      text: `Your OTP is: ${otp}`,
    });
  }

  async sendRegistrationOtp(
    email: string,
    name: string,
    otp: string,
  ) {
    await this.sendEmail({
      to: email,
      subject: 'Verify Your Account',
      html: this.otpTemplate(name, otp),
      text: `Your OTP is: ${otp}`,
    });
  }

  async sendOrderConfirmation(
    email: string,
    name: string,
    orderNumber: string,
    total: number,
  ) {
    const html = `
      <div style="font-family: Arial; max-width:500px; margin:auto; padding:20px;">
        <h2>Order Confirmed</h2>

        <p>Hello ${name || 'Customer'},</p>

        <p>
          Your order <strong>${orderNumber}</strong>
          has been received.
        </p>

        <p>
          Total:
          <strong>৳${total.toFixed(2)}</strong>
        </p>

        <p>
          We will notify you once your order ships.
        </p>
      </div>
    `;

    await this.sendEmail({
      to: email,
      subject: `Order Confirmed — ${orderNumber}`,
      html,
      text: `Order ${orderNumber} confirmed.`,
    });
  }

  private async sendEmail({
    to,
    subject,
    html,
    text,
  }: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) {
    this.logger.log(`Sending email to ${to}`);

    const result = await this.transporter.sendMail({
      from: `Shoukhinabesh <${this.fromEmail}>`,
      to,
      subject,
      html,
      text,
    });

    this.logger.log(
      `Email sent: ${result.messageId}`,
    );

    return result;
  }

  private otpTemplate(
    name: string,
    otp: string,
  ): string {
    return `
      <div style="font-family: Arial; max-width:500px; margin:auto; padding:20px;">
        <h2>Verify Your Account</h2>

        <p>Hello ${name || 'User'},</p>

        <p>Your OTP code is:</p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          letter-spacing: 8px;
          margin: 25px 0;
        ">
          ${otp.split('').join(' ')}
        </div>

        <p>
          This code expires in 10 minutes.
        </p>
      </div>
    `;
  }

  async sendTestEmail(
    to: string,
    subject = 'Test Email',
  ) {
    const html = `
      <div>
        <h3>Test Email</h3>
        <p>Email service is working properly.</p>
      </div>
    `;

    await this.sendEmail({
      to,
      subject,
      html,
      text: 'Test email',
    });

    return true;
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return (
        error.message +
        (error.stack ? '\n' + error.stack : '')
      );
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}