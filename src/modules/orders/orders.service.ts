import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PlaceOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { OrderStatus, PayStatus, Role } from '@prisma/client';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private mailService: MailService,
  ) {}

  async placeOrder(userId: string, dto: PlaceOrderDto) {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { items: { include: { product: true } } },
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    let subTotal = 0;
    for (const item of cart.items) {
      if (item.product.stock < item.quantity) {
        throw new BadRequestException(`Product ${item.product.name} is out of stock`);
      }
      subTotal += item.product.price * item.quantity;
    }

    let discount = 0;
    if (dto.couponCode) {
      const coupon = await this.prisma.coupon.findUnique({
        where: { code: dto.couponCode.toUpperCase() },
      });
      if (coupon && coupon.isActive && new Date() < coupon.validTo && subTotal >= coupon.minOrder) {
        discount = coupon.discountType === 'percent' 
          ? (subTotal * coupon.discountValue) / 100 
          : coupon.discountValue;
        
        await this.prisma.coupon.update({
          where: { id: coupon.id },
          data: { usageCount: { increment: 1 } },
        });
      }
    }

    const total = subTotal - discount;
    const orderNumber = 'ORD-' + Date.now().toString().slice(-8).toUpperCase();

    const order = await this.prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          customerId: userId,
          total,
          discount,
          shippingAddress: dto.shippingAddress || '',
          paymentMethod: dto.paymentMethod,
          notes: dto.notes,
          items: {
            create: cart.items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product.price,
            })),
          },
        },
        include: { customer: true },
      });

      for (const item of cart.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
      }

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

      return newOrder;
    });

    await this.mailService.sendOrderConfirmation(
      order.customer.email,
      order.customer.name,
      order.orderNumber,
      order.total,
    );

    return order;
  }

  async getMyOrders(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: { customerId: userId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.order.count({ where: { customerId: userId } }),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getAllOrders(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { name: true, email: true } } },
      }),
      this.prisma.order.count(),
    ]);
    return { orders, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async getOrderById(id: string, userId: string, role: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } }, customer: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (role !== Role.ADMIN && order.customerId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');

    return this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  async markAsPaid(id: string) {
    return this.prisma.order.update({
      where: { id },
      data: { paymentStatus: PayStatus.PAID },
    });
  }

  async cancelOrder(id: string, userId: string, role: Role) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    if (role !== Role.ADMIN && order.customerId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    if (order.status !== OrderStatus.PLACED) {
      throw new BadRequestException('Only placed orders can be cancelled');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedOrder = await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });

      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return updatedOrder;
    });
  }
}
