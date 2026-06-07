import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { memoryStorage } from 'multer';
import type { Request } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PlantDoctorService } from './plant-doctor.service';

@ApiTags('plant-doctor')
@ApiBearerAuth()
@Controller('plant-doctor')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PlantDoctorController {
  constructor(private plantDoctor: PlantDoctorService) {}

  @Post('cases')
  @Roles(Role.CLIENT)
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        city: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['file', 'city'],
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  createCase(
    @CurrentUser() user: { id: string; role: Role },
    @UploadedFile() file: Express.Multer.File,
    @Body() body: { city?: string; description?: string },
    @Req() req: Request,
  ) {
    return this.plantDoctor.createCase(user, file, body, req);
  }

  @Get('cases/mine')
  @Roles(Role.CLIENT)
  listMine(@CurrentUser() user: { id: string; role: Role }) {
    return this.plantDoctor.listMine(user);
  }

  @Get('partner/cases')
  @Roles(Role.PARTNER)
  listPartner(@CurrentUser() user: { id: string; role: Role }) {
    return this.plantDoctor.listPartner(user);
  }

  @Patch('partner/cases/:id/accept')
  @Roles(Role.PARTNER)
  acceptPartnerCase(@CurrentUser() user: { id: string; role: Role }, @Param('id') id: string) {
    return this.plantDoctor.acceptPartnerCase(user, id);
  }

  @Patch('partner/cases/:id/confirm')
  @Roles(Role.PARTNER)
  confirmPartnerCase(
    @CurrentUser() user: { id: string; role: Role },
    @Param('id') id: string,
    @Body() body: { diagnosis?: string; recommendation?: string },
  ) {
    return this.plantDoctor.confirmPartnerCase(user, id, body);
  }

  @Get('admin/cases')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.REGION_ADMIN)
  listAdmin() {
    return this.plantDoctor.listAdmin();
  }

  @Patch('admin/cases/:id/approve')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, Role.REGION_ADMIN)
  approveAdmin(@Param('id') id: string, @Body() body: { addToKnowledgeBase?: boolean }) {
    return this.plantDoctor.approveAdmin(id, Boolean(body?.addToKnowledgeBase));
  }
}
