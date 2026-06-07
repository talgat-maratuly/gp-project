import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { mkdirSync, writeFileSync } from 'fs';
import { join, extname } from 'path';
import { randomUUID } from 'crypto';
import type { Request } from 'express';

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_BYTES = 5 * 1024 * 1024;

export const SPECIALIST_UPLOAD_KINDS = [
  'profile',
  'id_front',
  'id_back',
  'vehicle',
  'registration',
  'driver_license',
  'equipment',
] as const;

export type SpecialistUploadKind = (typeof SPECIALIST_UPLOAD_KINDS)[number];

function defaultDevApiUrl(port: number): string {
  return ['http', '//localhost', String(port)].join(':');
}

@Injectable()
export class UploadsService {
  private readonly uploadRoot: string;

  constructor(private config: ConfigService) {
    this.uploadRoot = this.config.get<string>('UPLOAD_DIR') || join(process.cwd(), 'uploads');
    mkdirSync(this.uploadRoot, { recursive: true });
  }

  assertKind(kind: string): SpecialistUploadKind {
    if (!SPECIALIST_UPLOAD_KINDS.includes(kind as SpecialistUploadKind)) {
      throw new BadRequestException(`Invalid upload kind: ${kind}`);
    }
    return kind as SpecialistUploadKind;
  }

  assertFile(file: Express.Multer.File | undefined) {
    if (!file) throw new BadRequestException('File is required');
    if (!ALLOWED_MIME.has(file.mimetype)) {
      throw new BadRequestException('Only JPEG, PNG or WebP images are allowed');
    }
    if (file.size > MAX_BYTES) {
      throw new BadRequestException('Image must be 5 MB or smaller');
    }
  }

  saveSpecialistPhoto(userId: string, kind: SpecialistUploadKind, file: Express.Multer.File) {
    const ext = extname(file.originalname).toLowerCase() || this.extFromMime(file.mimetype);
    const userDir = join(this.uploadRoot, 'specialist', userId);
    mkdirSync(userDir, { recursive: true });
    const filename = `${kind}-${Date.now()}-${randomUUID()}${ext}`;
    const absolutePath = join(userDir, filename);
    writeFileSync(absolutePath, file.buffer);
    const relativePath = `specialist/${userId}/${filename}`;
    return { relativePath, filename };
  }

  savePlantPhoto(userId: string, file: Express.Multer.File) {
    const ext = extname(file.originalname).toLowerCase() || this.extFromMime(file.mimetype);
    const userDir = join(this.uploadRoot, 'plant-doctor', userId);
    mkdirSync(userDir, { recursive: true });
    const filename = `plant-${Date.now()}-${randomUUID()}${ext}`;
    const absolutePath = join(userDir, filename);
    writeFileSync(absolutePath, file.buffer);
    const relativePath = `plant-doctor/${userId}/${filename}`;
    return { relativePath, filename };
  }

  buildPublicUrl(relativePath: string, req?: Request): string {
    const configured = this.config.get<string>('PUBLIC_API_URL')?.trim();
    let base: string;
    if (configured) {
      base = configured.replace(/\/api\/?$/i, '');
    } else if (req) {
      const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
      const host = (req.headers['x-forwarded-host'] as string) || req.get('host');
      if (!host && this.config.get<string>('NODE_ENV') === 'production') {
        throw new Error('PUBLIC_API_URL is required in production when request host is unavailable');
      }
      base = host ? `${proto}://${host}` : defaultDevApiUrl(this.config.get<number>('PORT', 4000));
    } else {
      if (this.config.get<string>('NODE_ENV') === 'production') {
        throw new Error('PUBLIC_API_URL is required in production when request host is unavailable');
      }
      const port = this.config.get<number>('PORT', 4000);
      base = defaultDevApiUrl(port);
    }
    return `${base.replace(/\/$/, '')}/uploads/${relativePath.replace(/\\/g, '/')}`;
  }

  private extFromMime(mime: string): string {
    if (mime === 'image/png') return '.png';
    if (mime === 'image/webp') return '.webp';
    return '.jpg';
  }
}
