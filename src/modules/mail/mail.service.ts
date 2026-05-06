import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  // Resend removed — SMTP-only
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;

  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpPort = Number(this.config.get<string>('SMTP_PORT') || 587);
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS')?.replace(/\s+/g, '');

    this.fromEmail = this.config.get<string>('EMAIL_FROM') || 'no-reply@shoukhinabesh.com';

    // SMTP init
    if (smtpHost && smtpUser && smtpPass) {
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
        connectionTimeout: 5000,
        socketTimeout: 5000,
      });

      this.transporter
        .verify()
        .then(() => this.logger.log('✅ SMTP Ready'))
        .catch((err) =>
          this.logger.warn('⚠️ SMTP Verify Failed: ' + err),
        );
    }

    this.logger.log(`🚀 MailService initialized (SMTP: ${!!this.transporter})`);
  }

  // ================= PUBLIC API =================

  sendPasswordResetOtp(email: string, name: string, otp: string) {
    this.sendEmailNonBlocking({
      to: email,
      subject: 'Reset Your Password',
      html: this.otpTemplate(name, otp),
      text: `Your OTP is: ${otp}`,
    });
  }

  sendRegistrationOtp(email: string, name: string, otp: string) {
    this.sendEmailNonBlocking({
      to: email,
      subject: 'Verify Your Account',
      html: this.otpTemplate(name, otp),
      text: `Your OTP is: ${otp}`,
    });
  }

  sendOrderConfirmation(email: string, name: string, orderNumber: string, total: number) {
    const html = `
      <div style="font-family: Arial; max-width:500px; margin:auto; padding:20px;">
        <h2>Order Confirmed</h2>
        <p>Hello ${name || 'Customer'},</p>
        <p>Your order <strong>${orderNumber}</strong> has been received and is being processed.</p>
        <p>Total: <strong>&#2547;${total.toFixed(2)}</strong></p>
        <p>We will notify you when your order ships.</p>
      </div>
    `;

    this.sendEmailNonBlocking({
      to: email,
      subject: `Order Confirmed — ${orderNumber}`,
      html,
      text: `Order ${orderNumber} confirmed. Total: ${total}`,
    });
  }

  // ================= NON-BLOCKING WRAPPER =================

  private sendEmailNonBlocking(data: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) {
    this.sendEmail(data).catch((err) => {
      this.logger.error('❌ Email error: ' + this.getErrorMessage(err));
    });
  }

  // ================= CORE =================

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
    this.logger.log(`📨 Sending email → ${to}`);

    // -------- SMTP FIRST --------
    if (this.transporter) {
      try {
        const result = await Promise.race([
          this.transporter.sendMail({
            from: `Shoukhinabesh <${this.fromEmail}>`,
            to,
            subject,
            html,
            text,
          }),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('SMTP timeout')), 6000),
          ),
        ]);

        this.logger.log(`✅ SMTP sent ${(result as any).messageId}`);
        return;
      } catch (err) {
        this.logger.warn('⚠️ SMTP failed → fallback to Resend: ' + this.getErrorMessage(err));
      }
    }

    // If we reach here, SMTP was not available or failed — only SMTP is supported now
    throw new Error('SMTP transport not configured or failed. Configure SMTP_HOST/SMTP_USER/SMTP_PASS.');
  }

  // ================= TEMPLATE =================

  private otpTemplate(name: string, otp: string): string {
    return `
      <div style="font-family: Arial; max-width:500px; margin:auto; padding:20px;">
        <h2>Verify Your Account</h2>
        <p>Hello ${name || 'User'},</p>

        <p>Your OTP code is:</p>

        <div style="
          font-size: 30px;
          font-weight: bold;
          text-align: center;
          letter-spacing: 6px;
          margin: 20px 0;
        ">
          ${otp.split('').join(' ')}
        </div>

        <p>This code expires in 10 minutes.</p>
      </div>
    `;
  }

    // Exposed helper for testing from controllers or e2e tests
    async sendTestEmail(to: string, subject = 'Test email from Shoukhinabesh') {
      const html = `<div><h3>Test Email</h3><p>This is a test email from the backend.</p></div>`;
      try {
        await this.sendEmail({ to, subject, html, text: 'Test email' });
        return true;
      } catch (err) {
        this.logger.error('❌ sendTestEmail failed: ' + this.getErrorMessage(err));
        throw err;
      }
    }

    private getErrorMessage(error: unknown): string {
      if (error instanceof Error) return error.message + (error.stack ? '\n' + error.stack : '');
      try {
        return JSON.stringify(error);
      } catch {
        return String(error);
      }
    }
}