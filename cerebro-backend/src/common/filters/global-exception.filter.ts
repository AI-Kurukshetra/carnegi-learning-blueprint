import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, errorBody } = this.resolveException(exception);

    this.logger.error({
      timestamp: new Date().toISOString(),
      method: request.method,
      path: request.url,
      status,
      error: errorBody,
    });

    response.status(status).json({
      success: false,
      error: errorBody,
    });
  }

  private resolveException(exception: unknown): {
    status: number;
    errorBody: ErrorBody;
  } {
    if (exception instanceof HttpException) {
      return this.resolveHttpException(exception);
    }

    return {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      errorBody: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'An unexpected error occurred',
      },
    };
  }

  private resolveHttpException(exception: HttpException): {
    status: number;
    errorBody: ErrorBody;
  } {
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    if (typeof exceptionResponse === 'string') {
      return {
        status,
        errorBody: {
          code: this.statusToCode(status),
          message: exceptionResponse,
        },
      };
    }

    const responseObj = exceptionResponse as Record<string, unknown>;
    return {
      status,
      errorBody: {
        code: this.statusToCode(status),
        message:
          Array.isArray(responseObj['message'])
            ? (responseObj['message'] as string[]).join(', ')
            : String(responseObj['message'] ?? exception.message),
        details: Array.isArray(responseObj['message'])
          ? responseObj['message']
          : undefined,
      },
    };
  }

  private statusToCode(status: number): string {
    const map: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'UNPROCESSABLE_ENTITY',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
    };
    return map[status] ?? 'HTTP_ERROR';
  }
}
