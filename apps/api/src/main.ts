import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/http-exception.filter';

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
    console.warn('[GP API] CORS_ORIGINS не задан — укажите URL GP Service и GP Partner на Vercel');
    return [];
  }
  return [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174',
  ];
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  app.enableCors({
    origin: resolveCorsOrigins(configService),
    credentials: true,
  });
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
}
bootstrap();
