import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import nodemailer from 'nodemailer';
import type SMTPTransport from 'nodemailer/lib/smtp-transport';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  private readonly resend: Resend | null;
  private transporter: nodemailer.Transporter<SMTPTransport.SentMessageInfo> | null = null;

  private readonly fromEmail: string;

  constructor(private config: ConfigService) {
    const resendApiKey = this.config.get<string>('RESEND_API_KEY');

    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpPort = Number(this.config.get<string>('SMTP_PORT') || 587);
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS')?.replace(/\s+/g, '');

    this.fromEmail =
      this.config.get<string>('EMAIL_FROM') || 'onboarding@resend.dev';

    // Resend init
    this.resend = resendApiKey ? new Resend(resendApiKey) : null;

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

    this.logger.log(
      `🚀 MailService initialized (SMTP: ${!!this.transporter}, Resend: ${!!this.resend})`,
    );
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

  // ================= NON-BLOCKING WRAPPER =================

  private sendEmailNonBlocking(data: {
    to: string;
    subject: string;
    html: string;
    text: string;
  }) {
    this.sendEmail(data).catch((err) => {
      this.logger.error('❌ Email error:', err);
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
        this.logger.warn('⚠️ SMTP failed → fallback to Resend');
      }
    }

    // -------- RESEND FALLBACK --------
    if (this.resend) {
      const res = await this.resend.emails.send({
        from: `Shoukhinabesh <${this.fromEmail}>`,
        to,
        subject,
        html,
        text,
      });

      if (res.error) {
        throw new Error(res.error.message);
      }

      this.logger.log(`✅ Resend sent ${res.data?.id}`);
      return;
    }

    throw new Error('No email provider configured');
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
}