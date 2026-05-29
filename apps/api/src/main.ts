import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { DomainLoggingInterceptor } from './common/domain-logging.interceptor';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';

const DEFAULT_CORS_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:5175',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:5174',
  'http://127.0.0.1:5175',
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
    return DEFAULT_CORS_ORIGINS.filter((o) => o.startsWith('https://'));
  }
  return DEFAULT_CORS_ORIGINS;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useWebSocketAdapter(new IoAdapter(app));
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: resolveCorsOrigins(configService),
    credentials: true,
  });

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
  const host = process.env.RENDER ? 'https://gp-api.onrender.com' : `http://localhost:${port}`;
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
