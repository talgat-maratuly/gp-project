import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
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
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
