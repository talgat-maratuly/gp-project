import {
  BadRequestException,
  Body,
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RegionsService } from '../regions/regions.service';
import { CreateMarketOrderDto } from './dto/create-market-order.dto';
import { MarketService } from './market.service';

@ApiTags('market')
@Controller('market')
export class MarketController {
  constructor(
    private market: MarketService,
    private regions: RegionsService,
  ) {}

  private userFromReq(req: Request): User | null {
    return (req as Request & { user?: User }).user ?? null;
  }

  @Get('stores')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiQuery({ name: 'regionCode', required: false })
  @ApiBearerAuth()
  async stores(@Req() req: Request, @Query('regionCode') regionCode?: string) {
    const user = this.userFromReq(req);
    if (user) {
      return this.market.listStores(user);
    }
    const region = await this.resolvePublicRegion(regionCode);
    return this.market.listStoresByRegionId(region.id);
  }

  @Get('products')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiQuery({ name: 'categoryId', required: false })
  @ApiQuery({ name: 'storeId', required: false })
  @ApiQuery({ name: 'regionCode', required: false })
  @ApiQuery({ name: 'linkedServiceType', required: false, deprecated: true })
  async products(
    @Req() req: Request,
    @Query('categoryId') categoryId?: string,
    @Query('storeId') storeId?: string,
    @Query('regionCode') regionCode?: string,
  ) {
    const user = this.userFromReq(req);
    if (user) {
      return this.market.listProducts(user, { categoryId, storeId });
    }
    const region = await this.resolvePublicRegion(regionCode);
    return this.market.listProductsByRegionId(region.id, { categoryId, storeId });
  }

  @Get('products/:id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiQuery({ name: 'regionCode', required: false })
  async product(
    @Req() req: Request,
    @Param('id') id: string,
    @Query('regionCode') regionCode?: string,
  ) {
    const user = this.userFromReq(req);
    if (user) {
      return this.market.getProduct(user, id);
    }
    const region = await this.resolvePublicRegion(regionCode);
    return this.market.getProductPublic(id, region.id);
  }

  @Post('orders')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  @ApiBearerAuth()
  createOrder(@CurrentUser() user: User, @Body() dto: CreateMarketOrderDto) {
    return this.market.createOrder(user, dto);
  }

  private async resolvePublicRegion(regionCode?: string) {
    if (!regionCode?.trim()) {
      throw new BadRequestException('Укажите regionCode или авторизуйтесь');
    }
    const region = await this.regions.findByCode(regionCode.trim().toLowerCase());
    if (!region?.isActive) {
      throw new NotFoundException('Регион не найден');
    }
    return region;
  }
}
