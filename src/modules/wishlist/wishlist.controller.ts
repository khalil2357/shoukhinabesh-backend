import { Controller, Get, Post, Param, UseGuards, Req } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private readonly wishlistService: WishlistService) {}

  @ApiOperation({ summary: "Get current user's wishlist" })
  @Get()
  async getWishlist(@Req() req) {
    return this.wishlistService.getWishlist(req.user.id);
  }

  @ApiOperation({ summary: 'Toggle product in wishlist (add/remove)' })
  @Post('toggle/:productId')
  async toggleWishlist(@Param('productId') productId: string, @Req() req) {
    return this.wishlistService.toggleWishlist(req.user.id, productId);
  }
}
