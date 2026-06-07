import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { DomainLoggingInterceptor } from './common/domain-logging.interceptor';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';

const PROD_CORS_ORIGINS = [
  'https://gp-service.kz',
  'https://partner.gp-service.kz',
  'https://admin.gp-service.kz',
  'https://market.gp-service.kz',
  // DuckDNS staging / VPS
  'https://admingp.duckdns.org',
  'https://servicegp.duckdns.org',
  'https://partnergp.duckdns.org',
  'https://apigp.duckdns.org',
];

function devOrigin(host: string, port: number): string {
  return [`http://${host}`, String(port)].join(':');
}

function defaultCorsOrigins(isProd: boolean): string[] {
  if (isProd) return PROD_CORS_ORIGINS;
  return [
    devOrigin('localhost', 5173),
    devOrigin('localhost', 5174),
    devOrigin('localhost', 5175),
    devOrigin('127.0.0.1', 5173),
    devOrigin('127.0.0.1', 5174),
    devOrigin('127.0.0.1', 5175),
    ...PROD_CORS_ORIGINS,
  ];
}

function resolveCorsOrigins(config: ConfigService): string[] | boolean {
  const raw = config.get<string>('CORS_ORIGINS');
  if (raw?.trim()) {
    return raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  const isProd = config.get<string>('NODE_ENV') === 'production';
  if (isProd) {
    console.warn('[GP API] CORS_ORIGINS не задан — используем домены gp-service.kz по умолчанию');
    return defaultCorsOrigins(true);
  }
  return defaultCorsOrigins(false);
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  const configService = app.get(ConfigService);

  const uploadDir =
    configService.get<string>('UPLOAD_DIR') || join(process.cwd(), 'uploads');
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  app.enableCors({
    origin: resolveCorsOrigins(configService),
    credentials: true,
  });

  // Не exclude «uploads» — иначе @Controller('uploads') → POST /uploads/... без /api (404 на /api/uploads/...).
  // Статика файлов: express useStaticAssets('/uploads/') — globalPrefix-ке тәуелсіз.
  app.setGlobalPrefix('api', {
    exclude: [
      { path: 'health', method: RequestMethod.GET },
      { path: 'health/db', method: RequestMethod.GET },
      { path: 'health/ws', method: RequestMethod.GET },
      { path: 'health/full', method: RequestMethod.GET },
    ],
  });

  app.useGlobalInterceptors(new DomainLoggingInterceptor());

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('GP API')
    .setDescription('Backend для GP Service (клиенты) и GP Partner (партнёры).')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    jsonDocumentUrl: 'api/openapi.json',
  });

  const port = configService.get<number>('PORT', 4000);
  await app.listen(port);
  const publicApiUrl = configService.get<string>('PUBLIC_API_URL')?.trim();
  const host = publicApiUrl
    ? publicApiUrl.replace(/\/api\/?$/i, '').replace(/\/$/, '')
      : configService.get<string>('NODE_ENV') === 'production'
        ? `0.0.0.0:${port}`
      : ['http', '//localhost', String(port)].join(':');
  console.log(`GP API listening on port ${port}`);
  console.log(`Swagger ${host}/api/docs`);
  console.log(`Health ${host}/health · ${host}/health/db · ${host}/health/ws · ${host}/health/full`);
  console.log(`API base ${host}/api`);
}

bootstrap().catch((err: unknown) => {
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('EADDRINUSE')) {
    console.error('[GP API] Порт 4000 занят (EADDRINUSE). Выполните: npm run kill:ports && npm run dev:api:safe');
  } else {
    console.error('[GP API] Ошибка запуска:', msg);
  }
  process.exit(1);
});
