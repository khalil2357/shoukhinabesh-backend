import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private transporter: nodemailer.Transporter;
  private readonly logger = new Logger(MailService.name);

  constructor(private config: ConfigService) {
    const smtpHost = this.config.get<string>('SMTP_HOST');
    const smtpUser = this.config.get<string>('SMTP_USER');
    const smtpPass = this.config.get<string>('SMTP_PASS');

    if (!smtpHost || !smtpUser || !smtpPass) {
      this.logger.warn(
        `SMTP not fully configured. Host: ${!!smtpHost}, User: ${!!smtpUser}, Pass: ${!!smtpPass}`,
      );
    }

    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: this.config.get<number>('SMTP_PORT', 587),
      secure: false,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    this.logger.log(`Mail service initialized with SMTP host: ${smtpHost}`);
  }

  async sendRegistrationOtp(email: string, name: string, otp: string): Promise<void> {
    try {
      this.logger.log(`Attempting to send registration OTP to ${email}`);
      await this.transporter.sendMail({
        from: `"Shoukhinabesh" <${this.config.get('EMAIL_FROM')}>`,
        to: email,
        subject: 'The Vault: Verify Your Membership',
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 30px; background: #fafaf8; border: 1px solid #eaeaea;">
            <div style="text-align: center; margin-bottom: 30px;">
              <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.6em; color: #b8905b; margin: 0;">Shoukhinabesh</p>
            </div>
            <h2 style="color: #111; font-family: Georgia, serif; font-size: 24px; font-weight: normal; text-align: center; margin-bottom: 30px;">Welcome to The Vault</h2>
            <p style="color: #444; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">Dear ${name},</p>
            <p style="color: #444; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">To finalize your membership and secure your exclusive access, please enter the following verification code:</p>
            <div style="font-size: 32px; font-weight: 300; letter-spacing: 12px; color: #111; text-align: center; padding: 25px; background: #fff; border: 1px solid #eee; margin: 30px 0;">
              ${otp}
            </div>
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">This exclusive code will expire in 10 minutes.</p>
            <p style="color: #888; font-size: 12px; text-align: center;">If you did not request to join, please disregard this communication.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0 20px 0;" />
            <p style="font-size: 10px; color: #aaa; text-align: center; text-transform: uppercase; letter-spacing: 0.2em;">Shoukhinabesh &middot; Curated Destiny</p>
          </div>
        `,
      });
      this.logger.log(`✓ Registration OTP sent successfully to ${email}`);
    } catch (err) {
      this.logger.error(`✗ Failed to send registration OTP to ${email}`, err.message || err);
    }
  }

  async sendPasswordResetOtp(email: string, name: string, otp: string): Promise<void> {
    try {
      this.logger.log(`Attempting to send password reset OTP to ${email}`);
      await this.transporter.sendMail({
        from: `"Shoukhinabesh" <${this.config.get('EMAIL_FROM')}>`,
        to: email,
        subject: 'The Vault: Secure Your Account',
        html: `
          <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 40px 30px; background: #fafaf8; border: 1px solid #eaeaea;">
            <div style="text-align: center; margin-bottom: 30px;">
              <p style="font-size: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.6em; color: #b8905b; margin: 0;">Shoukhinabesh</p>
            </div>
            <h2 style="color: #111; font-family: Georgia, serif; font-size: 24px; font-weight: normal; text-align: center; margin-bottom: 30px;">Reset Your Secret Key</h2>
            <p style="color: #444; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">Dear ${name},</p>
            <p style="color: #444; font-size: 14px; line-height: 1.6; margin-bottom: 30px;">A request to reset your access key has been initiated. Use the following code to securely update your credentials:</p>
            <div style="font-size: 32px; font-weight: 300; letter-spacing: 12px; color: #111; text-align: center; padding: 25px; background: #fff; border: 1px solid #eee; margin: 30px 0;">
              ${otp}
            </div>
            <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">This secure code will expire in 10 minutes.</p>
            <p style="color: #888; font-size: 12px; text-align: center;">If you did not authorize this request, your vault remains secure and no further action is needed.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 40px 0 20px 0;" />
            <p style="font-size: 10px; color: #aaa; text-align: center; text-transform: uppercase; letter-spacing: 0.2em;">Shoukhinabesh &middot; Curated Destiny</p>
          </div>
        `,
      });
      this.logger.log(`✓ Password reset OTP sent successfully to ${email}`);
    } catch (err) {
      this.logger.error(`✗ Failed to send password reset OTP to ${email}`, err.message || err);
    }
  }

  async sendOrderConfirmation(
    email: string,
    name: string,
    orderNumber: string,
    total: number,
  ): Promise<void> {
    try {
      this.logger.log(`Attempting to send order confirmation to ${email} for order ${orderNumber}`);
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
      this.logger.log(`✓ Order confirmation sent successfully to ${email}`);
    } catch (err) {
      this.logger.error(`✗ Failed to send order confirmation to ${email}`, err.message || err);
    }
  }
}
