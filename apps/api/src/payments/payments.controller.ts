import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiQuery, ApiTags } from '@nestjs/swagger';
import { OrderCategory, Role } from '@prisma/client';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private payments: PaymentsService) {}

  @Get('architecture')
  architecture() {
    return this.payments.getPaymentArchitecture();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.PARTNER, Role.ADMIN)
  @Get('commission/preview')
  @ApiQuery({ name: 'category', enum: OrderCategory })
  @ApiQuery({ name: 'septicVolume', required: false })
  preview(
    @Query('category') category: OrderCategory,
    @Query('septicVolume') septicVolume?: string,
  ) {
    return this.payments.previewCommission(
      category,
      septicVolume ? parseInt(septicVolume, 10) : undefined,
    );
  }
}
