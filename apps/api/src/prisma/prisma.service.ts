import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { checkPrismaMigrations } from '../common/migration-check.util';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger('PrismaService');

  constructor(config: ConfigService) {
    const databaseUrl = config.get<string>('DATABASE_URL');
    if (!databaseUrl) {
      throw new Error(
        'DATABASE_URL не задан. Создайте apps/api/.env или .env в корне (см. apps/api/.env.example).',
      );
    }
    super({
      datasources: {
        db: { url: databaseUrl },
      },
    });
  }

  async onModuleInit() {
    await this.$connect();
    const migrationCheck = await checkPrismaMigrations(this);
    if (!migrationCheck.ok) {
      this.logger.warn(
        `[GP] Миграции не синхронизированы: ${migrationCheck.pending.join(', ') || migrationCheck.message}`,
      );
      this.logger.warn(`[GP] Выполните: ${migrationCheck.fixCommand}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
