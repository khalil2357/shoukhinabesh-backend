import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
} from './dto/product.dto';
import { Role } from '@prisma/client';
import slugify from 'slugify';
import { isValidObjectId } from 'mongoose';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  // ─────────────────────────────────────────────
  // CREATE PRODUCT
  // ─────────────────────────────────────────────
  async create(dto: CreateProductDto, vendorId: string) {
    const slug =
      slugify(dto.name, { lower: true, strict: true }) +
      '-' +
      Date.now();

    return this.prisma.product.create({
      data: {
        ...dto,
        slug,
        vendorId,
      },
    });
  }

  // ─────────────────────────────────────────────
  // GET ALL PRODUCTS (FILTER + PAGINATION)
  // ─────────────────────────────────────────────
  async findAll(query: ProductQueryDto) {
    const {
      search,
      categoryId,
      minPrice,
      maxPrice,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
    } = query;

    const skip = (page - 1) * limit;

    const where: any = { isPublished: true };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) where.categoryId = categoryId;

    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = Number(minPrice);
      if (maxPrice) where.price.lte = Number(maxPrice);
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: Number(limit),
        orderBy: { [sortBy]: order },
        include: {
          category: true,
          vendor: { select: { name: true } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─────────────────────────────────────────────
  // VENDOR PRODUCTS
  // ─────────────────────────────────────────────
  async getVendorProducts(vendorId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { vendorId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.product.count({ where: { vendorId } }),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ─────────────────────────────────────────────
  // GET PRODUCT BY SLUG
  // ─────────────────────────────────────────────
  async findBySlug(slug: string) {
    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        vendor: { select: { name: true, avatar: true } },
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // ─────────────────────────────────────────────
  // UPDATE PRODUCT (ROLE BASED ACCESS)
  // ─────────────────────────────────────────────
  async update(
    id: string,
    dto: UpdateProductDto,
    userId: string,
    role: Role,
  ) {
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (role !== Role.ADMIN && product.vendorId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to update this product',
      );
    }

    const data: any = { ...dto };

    if (dto.name) {
      data.slug =
        slugify(dto.name, { lower: true, strict: true }) +
        '-' +
        Date.now();
    }

    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  // ─────────────────────────────────────────────
  // DELETE PRODUCT (FULL SAFE VERSION)
  // ─────────────────────────────────────────────
  async remove(id: string) {
    // 1. Validate ID format
    if (!isValidObjectId(id)) {
      throw new BadRequestException('Invalid product ID');
    }

    try {
      // 2. Check existence first
      const product = await this.prisma.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // 3. Delete safely
      await this.prisma.product.delete({
        where: { id },
      });

      return {
        success: true,
        message: 'Product deleted successfully',
      };
    } catch (error) {
      throw new NotFoundException(
        'Failed to delete product (already deleted or invalid)',
      );
    }
  }
}
