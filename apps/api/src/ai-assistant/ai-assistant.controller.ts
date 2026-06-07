import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { AiAssistantService } from './ai-assistant.service';

@ApiTags('ai-assistant')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('ai')
export class AiAssistantController {
  constructor(private ai: AiAssistantService) {}

  @Post('orders/validate')
  validateOrder(@Body() body: Record<string, any>) {
    return this.ai.call('/ai/orders/validate', body, { entityType: 'order', entityId: body?.order?.id });
  }

  @Post('orders/match-partners')
  matchPartners(@Body() body: Record<string, any>) {
    return this.ai.call('/ai/orders/match-partners', body, { entityType: 'order', entityId: body?.order?.id });
  }

  @Post('market/recommend')
  recommendMarket(@Body() body: Record<string, any>) {
    return this.ai.call('/ai/market/recommend', body, { entityType: 'market', entityId: body?.serviceId });
  }

  @Post('irrigation/check')
  checkIrrigation(@Body() body: Record<string, any>) {
    return this.ai.call('/ai/irrigation/check', body, { entityType: 'irrigation_project', entityId: body?.project?.id });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.REGION_ADMIN)
  @Post('admin/audit')
  adminAudit(@Body() body: Record<string, any>) {
    return this.ai.call('/ai/admin/audit', body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.REGION_ADMIN)
  @Post('reports/service')
  reportService(@Body() body: Record<string, any>) {
    return this.ai.call('/ai/reports/service', body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.REGION_ADMIN)
  @Post('reports/partner')
  reportPartner(@Body() body: Record<string, any>) {
    return this.ai.call('/ai/reports/partner', body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.REGION_ADMIN)
  @Post('reports/admin')
  reportAdmin(@Body() body: Record<string, any>) {
    return this.ai.call('/ai/reports/admin', body);
  }
}
