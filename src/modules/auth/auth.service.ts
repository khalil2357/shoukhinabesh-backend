import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyRegistrationDto,
} from './dto/auth.dto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mail: MailService,
  ) {}

  // ─── Register ──────────────────────────────────────────────────────────────

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      if (existing.isVerified) {
        throw new ConflictException('Email already in use');
      } else {
        const hashed = await bcrypt.hash(dto.password, 12);
        await this.prisma.user.update({
          where: { email: dto.email },
          data: { name: dto.name, password: hashed },
        });
      }
    } else {
      const hashed = await bcrypt.hash(dto.password, 12);
      await this.prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashed,
          isVerified: false,
        },
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // Invalidate old OTPs
    if (user) {
      await this.prisma.otpCode.updateMany({
        where: { userId: user.id, used: false },
        data: { used: true },
      });

      const code = Math.floor(100000 + Math.random() * 900000).toString();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await this.prisma.otpCode.create({
        data: { userId: user.id, code, expiresAt },
      });

      await this.mail.sendRegistrationOtp(user.email, user.name, code);
    }

    return { message: 'OTP sent to email. Please verify.' };
  }

  // ─── Verify Registration ───────────────────────────────────────────────────

  async verifyRegistration(dto: VerifyRegistrationDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException('Invalid request');
    if (user.isVerified)
      throw new BadRequestException('User is already verified');

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code: dto.otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord)
      throw new BadRequestException('OTP is invalid or has expired');

    await this.prisma.$transaction([
      this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { isVerified: true },
      }),
    ]);

    return { message: 'Registration successful. You can now login.' };
  }

  // ─── Login ─────────────────────────────────────────────────────────────────

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.isActive)
      throw new UnauthorizedException('Invalid credentials');

    if (!user.isVerified)
      throw new UnauthorizedException('Please verify your email to login.');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    const { password, refreshToken, ...safeUser } = user;
    return { user: safeUser, ...tokens };
  }

  // ─── Refresh ───────────────────────────────────────────────────────────────

  async refresh(token: string) {
    let payload: { sub: string; email: string; role: string };
    try {
      payload = this.jwt.verify(token, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.refreshToken)
      throw new UnauthorizedException('Session expired. Please log in again.');

    const match = await bcrypt.compare(token, user.refreshToken);
    if (!match) throw new UnauthorizedException('Invalid refresh token');

    const tokens = await this.generateTokens(user.id, user.email, user.role);
    await this.storeRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  // ─── Logout ────────────────────────────────────────────────────────────────

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  // ─── Forgot Password ───────────────────────────────────────────────────────

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    // Always return success to prevent email enumeration
    if (!user)
      return { message: 'If that email exists, an OTP has been sent.' };

    // Invalidate old OTPs
    await this.prisma.otpCode.updateMany({
      where: { userId: user.id, used: false },
      data: { used: true },
    });

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.otpCode.create({
      data: { userId: user.id, code, expiresAt },
    });

    await this.mail.sendPasswordResetOtp(user.email, user.name, code);

    return { message: 'If that email exists, an OTP has been sent.' };
  }

  // ─── Reset Password ────────────────────────────────────────────────────────

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new BadRequestException('Invalid request');

    const otpRecord = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        code: dto.otp,
        used: false,
        expiresAt: { gt: new Date() },
      },
    });

    if (!otpRecord)
      throw new BadRequestException('OTP is invalid or has expired');

    const hashed = await bcrypt.hash(dto.newPassword, 12);

    await this.prisma.$transaction([
      this.prisma.otpCode.update({
        where: { id: otpRecord.id },
        data: { used: true },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashed, refreshToken: null },
      }),
    ]);

    return { message: 'Password reset successfully. Please log in.' };
  }

  // ─── Helpers ───────────────────────────────────────────────────────────────

  private async generateTokens(userId: string, email: string, role: string) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(
        { sub: userId, email, role },
        {
          secret: this.config.get<string>('JWT_SECRET'),
          expiresIn: 60 * 15, // 15 minutes in seconds
        },
      ),
      this.jwt.signAsync(
        { sub: userId, email, role },
        {
          secret: this.config.get<string>('JWT_REFRESH_SECRET'),
          expiresIn: 60 * 60 * 24 * 7, // 7 days in seconds
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async storeRefreshToken(userId: string, token: string) {
    const hashed = await bcrypt.hash(token, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }
}
