import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { NurseryService } from './nursery.service';

@ApiTags('nursery')
@Controller('nursery')
export class NurseryController {
  constructor(private nursery: NurseryService) {}

  @Get('products')
  @UseGuards(OptionalJwtAuthGuard)
  products(@Query() query: Record<string, string>) {
    return this.nursery.listPublicProducts(query);
  }

  @Post('requests')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  createRequest(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.nursery.createRequest(user, body);
  }

  @Get('requests/mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  myRequests(@CurrentUser() user: User) {
    return this.nursery.myRequests(user);
  }

  @Patch('offers/:id/accept')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  acceptOffer(@CurrentUser() user: User, @Param('id') id: string) {
    return this.nursery.acceptOffer(user, id);
  }

  @Post('preorders')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  createPreorder(@CurrentUser() user: User, @Body() body: Record<string, unknown>) {
    return this.nursery.createPreorder(user, body);
  }

  @Get('preorders/mine')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  myPreorders(@CurrentUser() user: User) {
    return this.nursery.myPreorders(user);
  }

  @Patch('preorder-offers/:id/accept')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT)
  acceptPreorderOffer(@CurrentUser() user: User, @Param('id') id: string) {
    return this.nursery.acceptPreorderOffer(user, id);
  }
}
