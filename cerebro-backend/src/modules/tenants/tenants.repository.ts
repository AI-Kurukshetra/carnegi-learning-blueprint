import { Injectable } from '@nestjs/common';
import { Prisma, Role, Tenant } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class TenantsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<Tenant[]> {
    return this.prisma.tenant.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
    });
  }

  findById(id: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({
      where: { id, deleted_at: null },
    });
  }

  findBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({
      where: { slug, deleted_at: null },
    });
  }

  createWithAdmin(data: {
    name: string;
    slug: string;
    adminEmail: string;
    adminPasswordHash: string;
    adminFirstName: string;
    adminLastName: string;
  }): Promise<Tenant> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: { name: data.name, slug: data.slug },
      });

      await tx.user.create({
        data: {
          tenant_id: tenant.id,
          email: data.adminEmail,
          password_hash: data.adminPasswordHash,
          role: Role.SCHOOL_ADMIN,
          first_name: data.adminFirstName,
          last_name: data.adminLastName,
          is_active: true,
          is_verified: true,
        },
      });

      return tenant;
    });
  }

  update(id: string, data: Prisma.TenantUpdateInput): Promise<Tenant> {
    return this.prisma.tenant.update({ where: { id }, data });
  }

  softDelete(id: string): Promise<Tenant> {
    return this.prisma.tenant.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
  }

  findUsersForTenant(tenantId: string) {
    return this.prisma.user.findMany({
      where: {
        tenant_id: tenantId,
        deleted_at: null,
        role: { in: ['TEACHER', 'STUDENT'] },
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        role: true,
        is_active: true,
        created_at: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  findByIdWithAdmin(id: string) {
    return this.prisma.tenant.findFirst({
      where: { id, deleted_at: null },
      include: {
        users: {
          where: { role: 'SCHOOL_ADMIN', deleted_at: null },
          select: { id: true, email: true },
          take: 1,
        },
      },
    });
  }
}
