import { Injectable } from '@nestjs/common';
import { RefreshToken, Tenant, User } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findTenantBySlug(slug: string): Promise<Tenant | null> {
    return this.prisma.tenant.findFirst({
      where: { slug, is_active: true, deleted_at: null },
    });
  }

  findActiveUserByEmail(tenantId: string, email: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        tenant_id: tenantId,
        email,
        is_active: true,
        deleted_at: null,
      },
    });
  }

  findUserById(tenantId: string, userId: string): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: { id: userId, tenant_id: tenantId, deleted_at: null },
    });
  }

  createRefreshToken(data: {
    tenantId: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
  }): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data: {
        tenant_id: data.tenantId,
        user_id: data.userId,
        token_hash: data.tokenHash,
        expires_at: data.expiresAt,
      },
    });
  }

  findActiveRefreshToken(tokenHash: string): Promise<RefreshToken | null> {
    return this.prisma.refreshToken.findFirst({
      where: {
        token_hash: tokenHash,
        is_revoked: false,
        expires_at: { gt: new Date() },
      },
    });
  }

  revokeRefreshToken(id: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { is_revoked: true, revoked_at: new Date() },
    });
  }

  revokeAllUserRefreshTokens(tenantId: string, userId: string): Promise<{ count: number }> {
    return this.prisma.refreshToken.updateMany({
      where: {
        tenant_id: tenantId,
        user_id: userId,
        is_revoked: false,
      },
      data: { is_revoked: true, revoked_at: new Date() },
    });
  }

  updateLastLogin(userId: string): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId },
      data: { last_login_at: new Date() },
    });
  }

  updateUser(
    tenantId: string,
    userId: string,
    data: Partial<Pick<User, 'first_name' | 'last_name' | 'password_hash'>>,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id: userId, tenant_id: tenantId },
      data,
    });
  }
}
