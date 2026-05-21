import { HttpException, HttpStatus } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export type GpErrorKind =
  | 'HTTP'
  | 'PRISMA'
  | 'AUTH'
  | 'GPS'
  | 'PORT'
  | 'NETWORK'
  | 'UNKNOWN';

export interface GpErrorPayload {
  statusCode: number;
  message: string | string[];
  error: string;
  kind: GpErrorKind;
  code?: string;
  hint?: string;
}

export function classifyException(exception: unknown): GpErrorPayload {
  if (exception instanceof HttpException) {
    const status = exception.getStatus();
    const res = exception.getResponse();
    let message: string | string[] = exception.message;
    if (typeof res === 'string') message = res;
    else if (typeof res === 'object' && res !== null && 'message' in res) {
      message = (res as { message: string | string[] }).message;
    }
    const kind: GpErrorKind =
      status === HttpStatus.UNAUTHORIZED || status === HttpStatus.FORBIDDEN ? 'AUTH' : 'HTTP';
    return {
      statusCode: status,
      message,
      error: HttpStatus[status] || 'HTTP_ERROR',
      kind,
    };
  }

  if (exception instanceof Prisma.PrismaClientKnownRequestError) {
    const hints: Record<string, string> = {
      P2002: 'Запись с такими данными уже существует',
      P2025: 'Запись не найдена',
      P2003: 'Связанная запись не найдена',
      P1001: 'Не удалось подключиться к PostgreSQL. Запустите БД и npm run prisma:migrate:deploy',
    };
    return {
      statusCode: HttpStatus.BAD_REQUEST,
      message: hints[exception.code] || exception.message,
      error: 'PRISMA_ERROR',
      kind: 'PRISMA',
      code: exception.code,
      hint: 'Проверьте DATABASE_URL и миграции: npm run prisma:migrate:deploy',
    };
  }

  if (exception instanceof Prisma.PrismaClientInitializationError) {
    return {
      statusCode: HttpStatus.SERVICE_UNAVAILABLE,
      message: 'Ошибка инициализации Prisma',
      error: 'PRISMA_INIT_ERROR',
      kind: 'PRISMA',
      hint: 'docker compose -f apps/api/docker-compose.yml up -d && npm run prisma:migrate:deploy',
    };
  }

  if (exception instanceof Error) {
    const msg = exception.message || 'Internal server error';
    if (msg.includes('EADDRINUSE')) {
      return {
        statusCode: HttpStatus.SERVICE_UNAVAILABLE,
        message: 'Порт API занят (EADDRINUSE :4000)',
        error: 'PORT_IN_USE',
        kind: 'PORT',
        hint: 'npm run kill:ports && npm run dev:api:safe',
      };
    }
    if (msg.toLowerCase().includes('geofence') || msg.toLowerCase().includes('gps')) {
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: msg,
        error: 'GPS_ERROR',
        kind: 'GPS',
      };
    }
    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: msg,
      error: 'INTERNAL_ERROR',
      kind: 'UNKNOWN',
    };
  }

  return {
    statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
    message: 'Internal server error',
    error: 'UNKNOWN',
    kind: 'UNKNOWN',
  };
}
