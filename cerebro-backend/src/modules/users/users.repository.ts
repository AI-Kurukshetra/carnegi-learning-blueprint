import { Injectable } from '@nestjs/common';
import { Prisma, Role, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface PaginatedUsers {
  data: User[];
  total: number;
}

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    opts: { role?: Role; page: number; limit: number },
  ): Promise<PaginatedUsers> {
    const where: Prisma.UserWhereInput = {
      tenant_id: tenantId,
      deleted_at: null,
      ...(opts.role ? { role: opts.role } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        skip: (opts.page - 1) * opts.limit,
        take: opts.limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { data, total };
  }

  findById(tenantId: string, id: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id, tenant_id: tenantId, deleted_at: null },
    });
  }

  findByEmail(tenantId: string, email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { tenant_id: tenantId, email, deleted_at: null },
    });
  }

  create(data: {
    tenantId: string;
    email: string;
    passwordHash: string;
    role: Role;
    firstName: string;
    lastName: string;
  }): Promise<User> {
    return this.prisma.user.create({
      data: {
        tenant_id: data.tenantId,
        email: data.email,
        password_hash: data.passwordHash,
        role: data.role,
        first_name: data.firstName,
        last_name: data.lastName,
      },
    });
  }

  update(
    tenantId: string,
    id: string,
    data: Prisma.UserUpdateInput,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id, tenant_id: tenantId },
      data,
    });
  }

  softDelete(tenantId: string, id: string): Promise<User> {
    return this.prisma.user.update({
      where: { id, tenant_id: tenantId },
      data: { deleted_at: new Date() },
    });
  }
}
