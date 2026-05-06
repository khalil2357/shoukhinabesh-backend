import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { PlaceOrderDto, UpdateOrderStatusDto } from './dto/order.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @ApiOperation({ summary: 'Place a new order from cart (Customer)' })
  @Roles(Role.CUSTOMER, Role.VENDOR)
  @UseGuards(RolesGuard)
  @Post()
  placeOrder(@CurrentUser('id') userId: string, @Body() dto: PlaceOrderDto) {
    return this.ordersService.placeOrder(userId, dto);
  }

  @ApiOperation({ summary: 'Get my orders' })
  @Get('me')
  getMyOrders(
    @CurrentUser('id') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.ordersService.getMyOrders(
      userId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 10,
    );
  }

  @ApiOperation({ summary: 'Get all orders (Admin)' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  getAllOrders(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.ordersService.getAllOrders(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @ApiOperation({ summary: 'Get order by ID' })
  @Get(':id')
  getOrder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.ordersService.getOrderById(id, userId, role);
  }

  @ApiOperation({ summary: 'Update order status (Admin, Vendor)' })
  @Roles(Role.ADMIN, Role.VENDOR)
  @UseGuards(RolesGuard)
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @ApiOperation({ summary: 'Cancel an order' })
  @Post(':id/cancel')
  cancelOrder(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') role: Role,
  ) {
    return this.ordersService.cancelOrder(id, userId, role);
  }
}
