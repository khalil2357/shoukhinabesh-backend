import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { MailOptions } from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private transporter: nodemailer.Transporter;

  private readonly fromEmail: string;

  constructor(private readonly config: ConfigService) {
    const host =
      this.config.get<string>('ETHEREAL_SMTP_HOST') ||
      this.config.get<string>('SMTP_HOST');
    const port =
      Number(
        this.config.get<string>('ETHEREAL_SMTP_PORT') ||
          this.config.get<string>('SMTP_PORT'),
      ) || 587;
    const user =
      this.config.get<string>('ETHEREAL_SMTP_USER') ||
      this.config.get<string>('SMTP_USER');
    const pass =
      this.config.get<string>('ETHEREAL_SMTP_PASS') ||
      this.config.get<string>('SMTP_PASS');

    if (!host || !user || !pass) {
      throw new Error(
        'Mail SMTP configuration is missing. Set ETHEREAL_SMTP_HOST, ETHEREAL_SMTP_PORT, ETHEREAL_SMTP_USER, and ETHEREAL_SMTP_PASS or the SMTP_* equivalents.',
      );
    }

    this.fromEmail = this.config.get<string>('EMAIL_FROM') || user;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: false, // STARTTLS for port 587

      auth: {
        user,
        pass,
      },

      tls: {
        rejectUnauthorized: false,
      },

      connectionTimeout: 20000,
      socketTimeout: 20000,
    });

    this.verifyConnection();
  }

  private async verifyConnection() {
    try {
      await this.transporter.verify();

      this.logger.log(
        'SMTP server connected successfully',
      );
    } catch (error) {
      this.logger.error(
        'SMTP connection failed',
      );

      this.logger.error(
        this.getErrorMessage(error),
      );
    }
  }

  async sendRegistrationOtp(
    email: string,
    name: string,
    otp: string,
  ) {
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Account',
      html: this.otpTemplate(name, otp),
      text: `Your OTP is ${otp}`,
    });
  }

  async sendPasswordResetOtp(
    email: string,
    name: string,
    otp: string,
  ) {
    return this.sendEmail({
      to: email,
      subject: 'Reset Password OTP',
      html: this.otpTemplate(name, otp),
      text: `Your OTP is ${otp}`,
    });
  }

  async sendOrderConfirmation(
    email: string,
    name: string,
    orderNumber: string,
    total: number,
  ) {
    const html = `
      <div style="
        font-family: Arial;
        max-width: 500px;
        margin: auto;
        padding: 20px;
      ">
        <h2>Order Confirmed ✅</h2>

        <p>
          Hello ${name || 'Customer'},
        </p>

        <p>
          Your order
          <strong>${orderNumber}</strong>
          has been placed successfully.
        </p>

        <p>
          Total Amount:
          <strong>৳${total.toFixed(2)}</strong>
        </p>

        <p>
          We will notify you once your order ships.
        </p>

        <br />

        <p>
          Thanks for shopping with us ❤️
        </p>
      </div>
    `;

    return this.sendEmail({
      to: email,
      subject: `Order Confirmed - ${orderNumber}`,
      html,
      text: `Your order ${orderNumber} has been confirmed.`,
    });
  }

  async sendTestEmail(
    to: string,
    subject = 'Test Email',
  ) {
    const html = `
      <div style="font-family: Arial;">
        <h2>Email Service Working ✅</h2>

        <p>
          NestJS Mail Service is working properly.
        </p>
      </div>
    `;

    return this.sendEmail({
      to,
      subject,
      html,
      text: 'Test email',
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
    try {
      this.logger.log(
        `Sending email to ${to}`,
      );

      const info =
        await this.transporter.sendMail({
          from: `Shoukhinabesh <${this.fromEmail}>`,
          to,
          subject,
          html,
          text,
        });

      this.logger.log(
        `Email sent successfully: ${info.messageId}`,
      );

      // Ethereal Preview URL
      const previewUrl =
        nodemailer.getTestMessageUrl(info);

      if (previewUrl) {
        this.logger.log(
          `Preview URL: ${previewUrl}`,
        );
      }

      return {
        success: true,
        messageId: info.messageId,
        previewUrl,
        provider: this.config.get<string>('ETHEREAL_SMTP_HOST')
          ? 'ethereal'
          : 'smtp',
      };
    } catch (error) {
      this.logger.error(
        'Email sending failed',
      );

      this.logger.error(
        this.getErrorMessage(error),
      );

      throw error;
    }
  }

  private otpTemplate(
    name: string,
    otp: string,
  ): string {
    return `
      <div style="
        font-family: Arial;
        max-width: 500px;
        margin: auto;
        padding: 20px;
      ">
        <h2>OTP Verification</h2>

        <p>
          Hello ${name || 'User'},
        </p>

        <p>
          Your OTP Code:
        </p>

        <div style="
          font-size: 32px;
          font-weight: bold;
          text-align: center;
          letter-spacing: 10px;
          margin: 25px 0;
        ">
          ${otp.split('').join(' ')}
        </div>

        <p>
          This OTP will expire in 10 minutes.
        </p>
      </div>
    `;
  }

  private getErrorMessage(
    error: unknown,
  ): string {
    if (error instanceof Error) {
      return (
        error.message +
        (error.stack
          ? '\n' + error.stack
          : '')
      );
    }

    try {
      return JSON.stringify(error);
    } catch {
      return String(error);
    }
  }
}
