import {
  Controller,
  Post,
  Query,
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
import { AccountActiveGuard } from '../user-status/guards/account-active.guard';
import { UploadsService } from './uploads.service';

@ApiTags('uploads')
@ApiBearerAuth()
@Controller('uploads')
@UseGuards(JwtAuthGuard, AccountActiveGuard, RolesGuard)
@Roles(Role.PARTNER)
export class UploadsController {
  constructor(private uploads: UploadsService) {}

  @Post('specialist-photo')
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: { type: 'string', format: 'binary' },
        kind: { type: 'string' },
      },
    },
  })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    }),
  )
  uploadSpecialistPhoto(
    @CurrentUser() user: { id: string },
    @UploadedFile() file: Express.Multer.File,
    @Query('kind') kind: string,
    @Req() req: Request,
  ) {
    const uploadKind = this.uploads.assertKind(kind || 'profile');
    this.uploads.assertFile(file);
    const { relativePath } = this.uploads.saveSpecialistPhoto(user.id, uploadKind, file);
    const url = this.uploads.buildPublicUrl(relativePath, req);
    return { url, kind: uploadKind };
  }
}
