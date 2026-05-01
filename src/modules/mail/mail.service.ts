import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async sendOtp(email: string, name: string, otp: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Shoukhinabesh" <${this.config.get('EMAIL_FROM')}>`,
        to: email,
        subject: 'Your Password Reset OTP',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
            <h2 style="color: #1a1a2e;">Password Reset</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your one-time password (OTP) for password reset is:</p>
            <div style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #e94560; text-align: center; padding: 20px; background: #fff; border-radius: 8px; margin: 20px 0;">
              ${otp}
            </div>
            <p>This OTP expires in <strong>10 minutes</strong>.</p>
            <p>If you did not request this, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #888;">Shoukhinabesh &middot; shoukhinabesh.com</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send OTP email to ${email}`, err);
    }
  }

  async sendOrderConfirmation(
    email: string,
    name: string,
    orderNumber: string,
    total: number,
  ): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: `"Shoukhinabesh" <${this.config.get('EMAIL_FROM')}>`,
        to: email,
        subject: `Order Confirmed — ${orderNumber}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #f9f9f9; border-radius: 8px;">
            <h2 style="color: #1a1a2e;">Order Confirmed!</h2>
            <p>Hello <strong>${name}</strong>,</p>
            <p>Your order <strong>${orderNumber}</strong> has been placed successfully!</p>
            <p>Total: <strong>&#2547;${total.toFixed(2)}</strong></p>
            <p>You will receive a shipping update soon.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
            <p style="font-size: 12px; color: #888;">Shoukhinabesh &middot; shoukhinabesh.com</p>
          </div>
        `,
      });
    } catch (err) {
      this.logger.error(`Failed to send order confirmation to ${email}`, err);
    }
  }
}
