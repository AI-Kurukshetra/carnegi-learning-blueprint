import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(private configService: ConfigService) {
    const host = configService.get<string>('DB_HOST');
    const port = configService.get<number>('DB_PORT');
    const username = configService.get<string>('DB_USERNAME');
    const password = configService.get<string>('DB_PASSWORD');
    const dbName = configService.get<string>('DB_NAME');

    // Cloud SQL Unix socket paths start with /cloudsql/
    const isUnixSocket = host?.startsWith('/cloudsql/');
    const url = isUnixSocket
      ? `postgresql://${username}:${password}@localhost/${dbName}?schema=public&host=${host}`
      : `postgresql://${username}:${password}@${host}:${port}/${dbName}?schema=public`;

    super({
      datasources: {
        db: { url },
      },
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  async runInTenantContext<T>(tenantId: string, fn: () => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(
        `SET LOCAL app.current_tenant_id = '${tenantId}'`,
      );
      return fn();
    });
  }
}
