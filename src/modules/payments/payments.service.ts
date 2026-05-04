import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { OrdersService } from '../orders/orders.service';
import Stripe from 'stripe';
import { PayStatus } from '@prisma/client';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const SSLCommerzPayment = require('sslcommerz-lts');

@Injectable()
export class PaymentsService {
  private stripe: InstanceType<typeof Stripe>;
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    private ordersService: OrdersService,
  ) {
    const stripeKey = this.config.get<string>('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      this.logger.warn('STRIPE_SECRET_KEY is missing. Stripe payments will not work.');
    } else {
      this.stripe = new Stripe(stripeKey);
    }
  }

  // ─── Stripe ────────────────────────────────────────────────────────────────

  async createStripeIntent(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== userId)
      throw new BadRequestException('Order does not belong to you');
    if (order.paymentStatus === PayStatus.PAID)
      throw new BadRequestException('Order is already paid');

    if (!this.stripe) throw new BadRequestException('Stripe is not configured');

    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(order.total * 100),
      currency: 'usd',
      metadata: { orderId },
    });

    return { clientSecret: intent.client_secret };
  }

  async handleStripeWebhook(
    rawBody: Buffer,
    signature: string,
  ): Promise<void> {
    if (!this.stripe) return;

    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET') ?? '';
    let event: ReturnType<typeof this.stripe.webhooks.constructEvent>;

    try {
      event = this.stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret,
      );
    } catch (err) {
      this.logger.error('Stripe webhook signature verification failed', err);
      throw new BadRequestException('Invalid Stripe webhook signature');
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object;
      const orderId = (intent as { metadata?: Record<string, string> }).metadata?.orderId;
      if (orderId) {
        await this.ordersService.completeOrder(orderId);
        this.logger.log(`Order ${orderId} marked as PAID and finalized via Stripe`);
      }
    }
  }

  // ─── SSLCommerz ────────────────────────────────────────────────────────────

  async initSSLCommerz(orderId: string, userId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: { select: { name: true, email: true } } },
    });

    if (!order) throw new NotFoundException('Order not found');
    if (order.customerId !== userId)
      throw new BadRequestException('Order does not belong to you');
    if (order.paymentStatus === PayStatus.PAID)
      throw new BadRequestException('Order is already paid');

    const storeId = this.config.get<string>('SSLCZ_STORE_ID') ?? '';
    const storePassword = this.config.get<string>('SSLCZ_STORE_PASS') ?? '';
    const isLive = this.config.get<boolean>('SSLCZ_IS_LIVE') ?? false;

    const apiBaseUrl = this.config.get<string>('API_BASE_URL') ?? 'http://localhost:3000';

    const data = {
      total_amount: order.total,
      currency: 'BDT',
      tran_id: order.orderNumber,
      success_url: `${apiBaseUrl}/api/v1/payments/sslcommerz/success`,
      fail_url: `${apiBaseUrl}/api/v1/payments/sslcommerz/fail`,
      cancel_url: `${apiBaseUrl}/api/v1/payments/sslcommerz/cancel`,
      ipn_url: `${apiBaseUrl}/api/v1/payments/sslcommerz/ipn`,
      shipping_method: 'Courier',
      product_name: `Order ${order.orderNumber}`,
      product_category: 'General',
      product_profile: 'general',
      cus_name: order.customer.name,
      cus_email: order.customer.email,
      cus_add1: order.shippingAddress ?? 'Bangladesh',
      cus_city: 'Dhaka',
      cus_country: 'Bangladesh',
      cus_phone: '01700000000',
      ship_name: order.customer.name,
      ship_add1: order.shippingAddress ?? 'Bangladesh',
      ship_city: 'Dhaka',
      ship_country: 'Bangladesh',
    };

    const sslcz = new SSLCommerzPayment(storeId, storePassword, isLive);
    const apiResponse = await sslcz.init(data);

    if (apiResponse?.GatewayPageURL) {
      return { gatewayUrl: apiResponse.GatewayPageURL };
    }

    throw new BadRequestException('Failed to initialize SSLCommerz session');
  }

  async handleSSLCommerzSuccess(body: Record<string, string>) {
    const { tran_id, val_id, status } = body;
    if (status !== 'VALID' && status !== 'VALIDATED') {
      throw new BadRequestException('Payment not valid');
    }

    const order = await this.prisma.order.findUnique({
      where: { orderNumber: tran_id },
    });
    if (order) {
      await this.ordersService.completeOrder(order.id);
      this.logger.log(
        `Order ${order.orderNumber} marked as PAID and finalized via SSLCommerz (val_id: ${val_id})`,
      );
    }

    return { message: 'Payment successful', orderNumber: tran_id };
  }

  async handleSSLCommerzFail(body: Record<string, string>) {
    const { tran_id } = body;
    const order = await this.prisma.order.findUnique({
      where: { orderNumber: tran_id },
    });
    if (order) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { paymentStatus: PayStatus.FAILED },
      });
    }
    return { message: 'Payment failed', orderNumber: tran_id };
  }
}
