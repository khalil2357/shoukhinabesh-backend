import { IsEnum, IsOptional, IsString, IsUrl } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UpdateUserDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional()
  @IsUrl()
  @IsOptional()
  avatar?: string;
}

export class UpdateUserRoleDto {
  @ApiPropertyOptional({ enum: Role })
  @IsEnum(Role)
  role: Role;
}
