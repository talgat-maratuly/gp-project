import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreatePartnerProductDto } from './dto/create-partner-product.dto';
import { CreatePartnerStoreDto } from './dto/create-partner-store.dto';
import { UpdatePartnerProductDto } from './dto/update-partner-product.dto';
import { PartnerMarketService } from './partner-market.service';

@ApiTags('partner-market')
@ApiBearerAuth()
@Controller('partner')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
export class PartnerMarketController {
  constructor(private partnerMarket: PartnerMarketService) {}

  @Get('stores')
  myStores(@CurrentUser() user: User) {
    return this.partnerMarket.listMyStores(user.id);
  }

  @Post('stores')
  createStore(@CurrentUser() user: User, @Body() dto: CreatePartnerStoreDto) {
    return this.partnerMarket.createStore(user, dto);
  }

  @Post('products')
  createProduct(@CurrentUser() user: User, @Body() dto: CreatePartnerProductDto) {
    return this.partnerMarket.createProduct(user, dto);
  }

  @Patch('products/:id')
  updateProduct(
    @CurrentUser() user: User,
    @Param('id') id: string,
    @Body() dto: UpdatePartnerProductDto,
  ) {
    return this.partnerMarket.updateProduct(user, id, dto);
  }
}
