import { Injectable } from '@nestjs/common';
import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class InvoicesRepository {
  constructor(private readonly prisma: PrismaService) {}

  findAll(tenantId?: string): Promise<Invoice[]> {
    return this.prisma.invoice.findMany({
      where: tenantId ? { tenant_id: tenantId } : undefined,
      orderBy: { created_at: 'desc' },
    });
  }

  findById(id: string): Promise<Invoice | null> {
    return this.prisma.invoice.findUnique({ where: { id } });
  }

  create(data: Prisma.InvoiceCreateInput): Promise<Invoice> {
    return this.prisma.invoice.create({ data });
  }

  update(id: string, data: Prisma.InvoiceUpdateInput): Promise<Invoice> {
    return this.prisma.invoice.update({ where: { id }, data });
  }

  getStats(): Promise<{ totalRevenue: number; pendingCount: number }> {
    return this.prisma.$transaction(async (tx) => {
      const paid = await tx.invoice.aggregate({
        _sum: { amount: true },
        where: { status: InvoiceStatus.PAID },
      });
      const pending = await tx.invoice.count({
        where: { status: InvoiceStatus.PENDING },
      });
      return {
        totalRevenue: Number(paid._sum.amount ?? 0),
        pendingCount: pending,
      };
    });
  }
}
