import { Injectable } from '@nestjs/common';
import { SchoolProfile } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateSchoolProfileDto } from './dto/update-school-profile.dto';

@Injectable()
export class SchoolProfileService {
  constructor(private readonly prisma: PrismaService) {}

  async getByTenant(tenantId: string): Promise<SchoolProfile> {
    return this.prisma.schoolProfile.upsert({
      where: { tenant_id: tenantId },
      create: { tenant_id: tenantId },
      update: {},
    });
  }

  async upsert(
    tenantId: string,
    dto: UpdateSchoolProfileDto,
  ): Promise<SchoolProfile> {
    return this.prisma.schoolProfile.upsert({
      where: { tenant_id: tenantId },
      create: {
        tenant_id: tenantId,
        address: dto.address,
        phone: dto.phone,
        logo_url: dto.logo_url,
        timezone: dto.timezone,
      },
      update: {
        ...(dto.address !== undefined ? { address: dto.address } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone } : {}),
        ...(dto.logo_url !== undefined ? { logo_url: dto.logo_url } : {}),
        ...(dto.timezone !== undefined ? { timezone: dto.timezone } : {}),
      },
    });
  }
}

