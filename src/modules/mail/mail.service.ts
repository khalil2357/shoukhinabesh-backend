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
    const resendApiKey = this.config.get<string>('RESEND_API_KEY');
    const smtpHost = this.config.get<string>('SMTP_HOST') || this.config.get<string>('ETHEREAL_SMTP_HOST');
    
    let host = smtpHost;
    let port = Number(this.config.get<string>('SMTP_PORT') || this.config.get<string>('ETHEREAL_SMTP_PORT')) || 587;
    let user = this.config.get<string>('SMTP_USER') || this.config.get<string>('ETHEREAL_SMTP_USER');
    let pass = this.config.get<string>('SMTP_PASS') || this.config.get<string>('ETHEREAL_SMTP_PASS');

    // Fallback to Resend SMTP if API key is provided but SMTP host is not
    if (!host && resendApiKey) {
      this.logger.log('SMTP configuration missing, but RESEND_API_KEY found. Using Resend SMTP.');
      host = 'smtp.resend.com';
      port = 465;
      user = 'resend';
      pass = resendApiKey;
    }

    this.fromEmail = this.config.get<string>('EMAIL_FROM') || user || 'noreply@shoukhinabesh.com';

    if (host && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 10000,
      });
      this.verifyConnection();
    } else {
      this.logger.warn('Mail service initialized without a provider. Emails will not be sent.');
      // Create a dummy transporter that just logs
      this.transporter = {
        sendMail: async (opts: any) => {
          this.logger.log(`[DUMMY MAIL] To: ${opts.to}, Subject: ${opts.subject}`);
          return { messageId: 'dummy-id' };
        },
        verify: async () => true,
      } as any;
    }
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

  async sendRegistrationLink(
    email: string,
    name: string,
    link: string,
  ) {
    return this.sendEmail({
      to: email,
      subject: 'Verify Your Account',
      html: this.registrationLinkTemplate(name, link),
      text: `Please verify your account by clicking this link: ${link}`,
    });
  }

  private registrationLinkTemplate(name: string, link: string): string {
    return `
      <div style="
        font-family: Arial;
        max-width: 500px;
        margin: auto;
        padding: 20px;
        border: 1px solid #eee;
        border-radius: 10px;
      ">
        <h2 style="color: #1a1a1a;">Welcome to Shoukhinabesh</h2>
        <p>Hello ${name || 'User'},</p>
        <p>Thank you for joining us. Please click the button below to verify your email and activate your account:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${link}" style="
            background-color: #1a1a1a;
            color: white;
            padding: 12px 30px;
            text-decoration: none;
            border-radius: 5px;
            font-weight: bold;
            display: inline-block;
          ">Verify Account</a>
        </div>
        <p style="font-size: 12px; color: #666;">If the button doesn't work, copy and paste this link into your browser:</p>
        <p style="font-size: 12px; color: #666;">${link}</p>
        <p style="font-size: 12px; color: #666; margin-top: 30px;">This link will expire in 24 hours.</p>
      </div>
    `;
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
