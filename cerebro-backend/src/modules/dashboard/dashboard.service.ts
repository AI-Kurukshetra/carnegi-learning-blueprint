import { Injectable } from '@nestjs/common';
import {
  ClassroomsService,
  TeacherDashboardStats,
} from '../classrooms/classrooms.service';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(
    private readonly classroomsService: ClassroomsService,
    private readonly prisma: PrismaService,
  ) {}

  getTeacherDashboard(
    tenantId: string,
    teacherId: string,
  ): Promise<TeacherDashboardStats> {
    return this.classroomsService.getTeacherDashboardStats(tenantId, teacherId);
  }

  async getSuperAdminDashboard() {
    const [tenantCount, userCount, invoiceStats] = await Promise.all([
      this.prisma.tenant.count({ where: { deleted_at: null } }),
      this.prisma.user.count({ where: { deleted_at: null, role: { in: ['TEACHER', 'STUDENT'] } } }),
      this.prisma.invoice.aggregate({
        _sum: { amount: true },
        where: { status: 'PAID' },
      }),
    ]);
    const pendingInvoices = await this.prisma.invoice.count({ where: { status: 'PENDING' } });
    return {
      total_tenants: tenantCount,
      total_users: userCount,
      total_revenue: Number(invoiceStats._sum.amount ?? 0),
      pending_invoices: pendingInvoices,
      ai_usage_percentage: 68,
    };
  }
}
