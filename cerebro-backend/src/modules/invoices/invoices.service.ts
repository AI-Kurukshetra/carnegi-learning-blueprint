import { Injectable, NotFoundException } from '@nestjs/common';
import { Invoice } from '@prisma/client';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { InvoicesRepository } from './invoices.repository';

@Injectable()
export class InvoicesService {
  constructor(private readonly repo: InvoicesRepository) {}

  findAll(tenantId?: string): Promise<Invoice[]> {
    return this.repo.findAll(tenantId);
  }

  async findById(id: string): Promise<Invoice> {
    const invoice = await this.repo.findById(id);
    if (!invoice) throw new NotFoundException(`Invoice "${id}" not found`);
    return invoice;
  }

  create(dto: CreateInvoiceDto): Promise<Invoice> {
    return this.repo.create({
      tenant: { connect: { id: dto.tenant_id } },
      amount: dto.amount,
      currency: dto.currency ?? 'USD',
      status: dto.status,
      due_date: new Date(dto.due_date),
      description: dto.description,
    });
  }

  getStats() {
    return this.repo.getStats();
  }
}
