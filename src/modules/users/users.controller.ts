import {
  Controller,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, UpdateUserRoleDto } from './dto/user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get my profile' })
  @Get('me')
  getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findOne(userId);
  }

  @ApiOperation({ summary: 'Update my profile' })
  @Patch('me')
  updateMe(@CurrentUser('id') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(userId, dto);
  }

  @ApiOperation({ summary: 'Get all users (Admin)' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  findAll(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.usersService.findAll(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @ApiOperation({ summary: 'Get user by ID (Admin)' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @ApiOperation({ summary: 'Update user role (Admin)' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() dto: UpdateUserRoleDto) {
    return this.usersService.updateRole(id, dto);
  }

  @ApiOperation({ summary: 'Toggle user status (Admin)' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.usersService.toggleStatus(id);
  }

  @ApiOperation({ summary: 'Delete user (Admin)' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }
}
