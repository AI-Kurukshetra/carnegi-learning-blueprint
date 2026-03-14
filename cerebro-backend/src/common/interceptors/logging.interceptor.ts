import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Request } from 'express';
import { Observable, tap } from 'rxjs';
import { RequestUser } from '../types/request-user.type';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url } = request;
    const user = request.user as RequestUser | undefined;
    const startTime = Date.now();

    this.logger.log({
      event: 'REQUEST',
      method,
      path: url,
      userId: user?.id ?? 'anonymous',
      tenantId: user?.tenant_id ?? 'none',
    });

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        this.logger.log({
          event: 'RESPONSE',
          method,
          path: url,
          duration: `${duration}ms`,
        });
      }),
    );
  }
}
