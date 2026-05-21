import { ExceptionFilter, Catch, ArgumentsHost, Logger } from '@nestjs/common';
import { Response } from 'express';
import { classifyException } from './gp-error.util';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('GpException');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const payload = classifyException(exception);

    if (payload.statusCode >= 500 || payload.kind === 'PRISMA' || payload.kind === 'PORT') {
      this.logger.error(
        `[${payload.kind}] ${payload.message}${payload.hint ? ` | ${payload.hint}` : ''}`,
        exception instanceof Error ? exception.stack : undefined,
      );
    }

    response.status(payload.statusCode).json(payload);
  }
}
