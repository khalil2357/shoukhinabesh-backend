import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateCouponDto,
  UpdateCouponDto,
  ValidateCouponDto,
} from './dto/coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (existing) throw new ConflictException('Coupon code already exists');
    return this.prisma.coupon.create({
      data: {
        ...dto,
        code: dto.code.toUpperCase(),
        validFrom: new Date(dto.validFrom),
        validTo: new Date(dto.validTo),
      },
    });
  }

  async findAll(page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [coupons, total] = await Promise.all([
      this.prisma.coupon.findMany({ skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.coupon.count(),
    ]);
    return { coupons, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon) throw new NotFoundException('Coupon not found');
    return coupon;
  }

  async update(id: string, dto: UpdateCouponDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.validTo) data.validTo = new Date(dto.validTo);
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Coupon deleted' };
  }

  async validate(dto: ValidateCouponDto) {
    const coupon = await this.prisma.coupon.findUnique({
      where: { code: dto.code.toUpperCase() },
    });
    if (!coupon || !coupon.isActive)
      throw new BadRequestException('Invalid or inactive coupon');
    if (coupon.usageCount >= coupon.usageLimit)
      throw new BadRequestException('Coupon usage limit reached');
    if (new Date() < coupon.validFrom)
      throw new BadRequestException('Coupon is not yet valid');
    if (new Date() > coupon.validTo)
      throw new BadRequestException('Coupon has expired');
    if (dto.orderTotal < coupon.minOrder)
      throw new BadRequestException(
        `Minimum order of ${coupon.minOrder} required for this coupon`,
      );

    const discount =
      coupon.discountType === 'percent'
        ? parseFloat(((dto.orderTotal * coupon.discountValue) / 100).toFixed(2))
        : coupon.discountValue;

    return {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discount,
      finalTotal: parseFloat(Math.max(dto.orderTotal - discount, 0).toFixed(2)),
    };
  }
}
