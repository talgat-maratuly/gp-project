import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { PartnerBalanceService } from './partner-balance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('partner-balance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.PARTNER)
@Controller('partners/balance')
export class PartnerBalanceController {
  constructor(private balance: PartnerBalanceService) {}

  @Get()
  getBalance(@CurrentUser() user: { id: string }) {
    return this.balance.getBalance(user.id);
  }

  @Get('transactions')
  transactions(@CurrentUser() user: { id: string }) {
    return this.balance.getTransactions(user.id);
  }

  @Post('topup')
  topup(@CurrentUser() user: { id: string }, @Body() body: { amount: number; note?: string }) {
    return this.balance.topup(user.id, body.amount, body.note);
  }
}
