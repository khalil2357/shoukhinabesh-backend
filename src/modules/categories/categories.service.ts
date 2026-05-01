import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import slugify from 'slugify';

function toSlug(name: string): string {
  return slugify(name, { lower: true, strict: true });
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCategoryDto) {
    const slug = toSlug(dto.name);
    const existing = await this.prisma.category.findUnique({ where: { slug } });
    if (existing) throw new ConflictException('Category already exists');
    return this.prisma.category.create({
      data: { name: dto.name, slug, imageUrl: dto.imageUrl },
    });
  }

  async findAll() {
    return this.prisma.category.findMany({ orderBy: { name: 'asc' } });
  }

  async findOne(id: string) {
    const cat = await this.prisma.category.findUnique({ where: { id } });
    if (!cat) throw new NotFoundException('Category not found');
    return cat;
  }

  async update(id: string, dto: UpdateCategoryDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = { ...dto };
    if (dto.name) data.slug = toSlug(dto.name);
    return this.prisma.category.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.category.delete({ where: { id } });
    return { message: 'Category deleted' };
  }
}
