import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, map } from 'rxjs';

interface SuccessResponse<T> {
  success: true;
  data: T;
  meta?: Record<string, unknown>;
}

@Injectable()
export class ResponseTransformInterceptor<T>
  implements NestInterceptor<T, SuccessResponse<T>>
{
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<SuccessResponse<T>> {
    return next.handle().pipe(
      map((response) => {
        if (this.isAlreadyEnveloped(response)) {
          return response as unknown as SuccessResponse<T>;
        }

        return { success: true as const, data: response };
      }),
    );
  }

  private isAlreadyEnveloped(response: unknown): boolean {
    return (
      response !== null &&
      typeof response === 'object' &&
      'success' in (response as object)
    );
  }
}
