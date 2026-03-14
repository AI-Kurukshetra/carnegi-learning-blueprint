import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { RequestUser } from '../types/request-user.type';

export const TenantId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();
    const user = request.user as RequestUser | undefined;
    if (user?.tenant_id) {
      return user.tenant_id;
    }
    return (request.headers['x-tenant-id'] as string) ?? '';
  },
);
