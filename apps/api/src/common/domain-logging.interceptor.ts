import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap, catchError, throwError } from 'rxjs';
import { Request } from 'express';

type LogDomain = 'AUTH' | 'ORDER' | 'PARTNER' | 'QR' | 'API';

function resolveDomain(url: string): LogDomain | null {
  const p = url.split('?')[0];
  if (p.includes('/auth')) return 'AUTH';
  if (p.includes('/orders')) return 'ORDER';
  if (p.includes('/partners')) return 'PARTNER';
  if (p.includes('/qr')) return 'QR';
  return null;
}

@Injectable()
export class DomainLoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const domain = resolveDomain(req.url || '');
    if (!domain) return next.handle();

    const logger = new Logger(`GP:${domain}`);
    const started = Date.now();
    const userId = (req as Request & { user?: { id?: string } }).user?.id;
    const meta = `${req.method} ${req.url}${userId ? ` user=${userId}` : ''}`;

    logger.log(meta);

    return next.handle().pipe(
      tap(() => {
        logger.log(`OK ${meta} +${Date.now() - started}ms`);
      }),
      catchError((err: Error) => {
        logger.warn(`FAIL ${meta} +${Date.now() - started}ms — ${err?.message || err}`);
        return throwError(() => err);
      }),
    );
  }
}
