import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
  VerifyRegistrationDto,
  SyncFirebaseUserDto,
  ValidateUserDto,
} from './dto/auth.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Sync Firebase user to MongoDB' })
  @Post('firebase/sync-user')
  syncFirebaseUser(@Body() dto: SyncFirebaseUserDto) {
    return this.authService.syncFirebaseUser(dto);
  }

  @ApiOperation({ summary: 'Validate user existence in MongoDB' })
  @HttpCode(HttpStatus.OK)
  @Post('firebase/validate-user')
  validateUser(@Body() dto: ValidateUserDto) {
    return this.authService.validateUser(dto);
  }

  @ApiOperation({ summary: 'Check if email is available in MongoDB' })
  @HttpCode(HttpStatus.OK)
  @Post('firebase/check-email')
  checkEmail(@Body() dto: ValidateUserDto) {
    return this.authService.checkEmail(dto);
  }

  @ApiOperation({ summary: 'Register a new customer account (sends OTP)' })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Verify registration OTP' })
  @HttpCode(HttpStatus.OK)
  @Post('verify-registration')
  verifyRegistration(@Body() dto: VerifyRegistrationDto) {
    return this.authService.verifyRegistration(dto);
  }

  @ApiOperation({ summary: 'Login and receive JWT tokens' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Rotate refresh token' })
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto.refreshToken);
  }

  @ApiOperation({ summary: 'Invalidate refresh token (logout)' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }

  @ApiOperation({ summary: 'Send OTP to email for password reset' })
  @HttpCode(HttpStatus.OK)
  @Post('forgot-password')
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @ApiOperation({ summary: 'Verify OTP and set new password' })
  @HttpCode(HttpStatus.OK)
  @Post('reset-password')
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }
}
