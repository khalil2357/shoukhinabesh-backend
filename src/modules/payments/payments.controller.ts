import {
  Controller,
  Post,
  Body,
  Headers,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Request } from 'express';
import { PaymentsService } from './payments.service';
import {
  CreatePaymentIntentDto,
  InitSSLCommerzDto,
} from './dto/payment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ─── Stripe ──────────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Create Stripe PaymentIntent (Customer)' })
  @ApiBearerAuth()
  @Roles(Role.CUSTOMER, Role.VENDOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('stripe/intent')
  createStripeIntent(
    @Body() dto: CreatePaymentIntentDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.createStripeIntent(dto.orderId, userId);
  }

  @ApiOperation({ summary: 'Stripe webhook endpoint (called by Stripe)' })
  @HttpCode(HttpStatus.OK)
  @Post('stripe/webhook')
  stripeWebhook(
    @Req() req: Request & { rawBody?: Buffer },
    @Headers('stripe-signature') sig: string,
  ) {
    return this.paymentsService.handleStripeWebhook(req.rawBody!, sig);
  }

  // ─── SSLCommerz ──────────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Initialize SSLCommerz session (Customer)' })
  @ApiBearerAuth()
  @Roles(Role.CUSTOMER, Role.VENDOR)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('sslcommerz/init')
  initSSLCommerz(
    @Body() dto: InitSSLCommerzDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.paymentsService.initSSLCommerz(dto.orderId, userId);
  }

  @ApiOperation({ summary: 'SSLCommerz success callback' })
  @HttpCode(HttpStatus.OK)
  @Post('sslcommerz/success')
  sslCommerzSuccess(@Body() body: Record<string, string>) {
    return this.paymentsService.handleSSLCommerzSuccess(body);
  }

  @ApiOperation({ summary: 'SSLCommerz fail callback' })
  @HttpCode(HttpStatus.OK)
  @Post('sslcommerz/fail')
  sslCommerzFail(@Body() body: Record<string, string>) {
    return this.paymentsService.handleSSLCommerzFail(body);
  }

  @ApiOperation({ summary: 'SSLCommerz cancel callback' })
  @HttpCode(HttpStatus.OK)
  @Post('sslcommerz/cancel')
  sslCommerzCancel() {
    return { message: 'Payment cancelled by user' };
  }
}
