import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateCouponDto {
  @ApiProperty({ example: 'SAVE10' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ enum: ['percent', 'fixed'] })
  @IsEnum(['percent', 'fixed'])
  discountType: string;

  @ApiProperty({ example: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountValue: number;

  @ApiPropertyOptional({ example: 500 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  minOrder?: number;

  @ApiPropertyOptional({ example: 100 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @IsOptional()
  usageLimit?: number;

  @ApiProperty({ example: '2026-01-01T00:00:00Z' })
  @IsDateString()
  validFrom: string;

  @ApiProperty({ example: '2026-12-31T23:59:59Z' })
  @IsDateString()
  validTo: string;
}

export class UpdateCouponDto {
  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  discountValue?: number;

  @ApiPropertyOptional()
  @IsDateString()
  @IsOptional()
  validTo?: string;
}

export class ValidateCouponDto {
  @ApiProperty({ example: 'SAVE10' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ example: 1000 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  orderTotal: number;
}
