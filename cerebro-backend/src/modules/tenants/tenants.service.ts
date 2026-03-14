import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Tenant } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { TenantsRepository } from './tenants.repository';

const BCRYPT_ROUNDS = 10;

@Injectable()
export class TenantsService {
  constructor(private readonly tenantsRepository: TenantsRepository) {}

  findAll(): Promise<Tenant[]> {
    return this.tenantsRepository.findAll();
  }

  async findById(id: string) {
    const tenant = await this.tenantsRepository.findByIdWithAdmin(id);
    if (!tenant) {
      throw new NotFoundException(`Tenant with id "${id}" not found`);
    }
    const { users, ...rest } = tenant as any;
    return { ...rest, admin_user: users?.[0] ?? null };
  }

  async getTenantUsers(tenantId: string) {
    await this.findById(tenantId);
    return this.tenantsRepository.findUsersForTenant(tenantId);
  }

  async create(dto: CreateTenantDto): Promise<Tenant> {
    const existing = await this.tenantsRepository.findBySlug(dto.slug);
    if (existing) {
      throw new ConflictException(`Tenant slug "${dto.slug}" is already taken`);
    }

    const adminPasswordHash = await bcrypt.hash(
      dto.admin_password,
      BCRYPT_ROUNDS,
    );

    return this.tenantsRepository.createWithAdmin({
      name: dto.name,
      slug: dto.slug,
      adminEmail: dto.admin_email,
      adminPasswordHash,
      adminFirstName: dto.admin_first_name,
      adminLastName: dto.admin_last_name,
    });
  }

  async update(id: string, dto: UpdateTenantDto): Promise<Tenant> {
    await this.findById(id);

    if (dto.slug) {
      const existing = await this.tenantsRepository.findBySlug(dto.slug);
      if (existing && existing.id !== id) {
        throw new ConflictException(
          `Tenant slug "${dto.slug}" is already taken`,
        );
      }
    }

    return this.tenantsRepository.update(id, dto);
  }

  async remove(id: string): Promise<void> {
    await this.findById(id);
    await this.tenantsRepository.softDelete(id);
  }
}
