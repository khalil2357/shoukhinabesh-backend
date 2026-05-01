import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/review.dto';
import { OrderStatus } from '@prisma/client';

@Injectable()
export class ReviewsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateReviewDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });
    if (!product) throw new NotFoundException('Product not found');

    const deliveredOrder = await this.prisma.order.findFirst({
      where: {
        customerId: userId,
        status: OrderStatus.DELIVERED,
        items: { some: { productId: dto.productId } },
      },
    });
    if (!deliveredOrder) {
      throw new BadRequestException(
        'You can only review products from delivered orders',
      );
    }

    const existing = await this.prisma.review.findFirst({
      where: { userId, productId: dto.productId },
    });
    if (existing)
      throw new ConflictException('You have already reviewed this product');

    return this.prisma.review.create({
      data: {
        userId,
        productId: dto.productId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
      },
    });
  }

  async getProductReviews(productId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        where: { productId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.review.count({ where: { productId } }),
    ]);

    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return {
      reviews,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      avgRating: parseFloat(avgRating.toFixed(1)),
    };
  }

  async remove(id: string) {
    const review = await this.prisma.review.findUnique({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    await this.prisma.review.delete({ where: { id } });
    return { message: 'Review deleted' };
  }
}
