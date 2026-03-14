import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID, createHash } from 'crypto';
import { JwtPayload } from '../../common/types/jwt-payload.type';
import { RequestUser } from '../../common/types/request-user.type';
import { AuthRepository } from './auth.repository';
import { LoginDto } from './dto/login.dto';
import { UpdateMeDto } from './dto/update-me.dto';

const BCRYPT_ROUNDS = 10;
const REFRESH_TOKEN_TTL_DAYS = 7;

export interface AuthTokenPair {
  access_token: string;
  refresh_token: string;
}

export interface LoginResponse extends AuthTokenPair {
  user: {
    id: string;
    email: string;
    role: string;
    first_name: string;
    last_name: string;
    tenant_id: string;
  };
}

export interface MeResponse {
  id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  tenant_id: string;
  is_verified: boolean;
  last_login_at: Date | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async login(dto: LoginDto): Promise<LoginResponse> {
    const tenant = await this.authRepository.findTenantBySlug(dto.tenant_slug);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    const user = await this.authRepository.findActiveUserByEmail(
      tenant.id,
      dto.email,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.verifyPassword(dto.password, user.password_hash);

    const tokens = await this.generateTokenPair(user);
    await this.authRepository.updateLastLogin(user.id);

    return {
      ...tokens,
      user: this.mapUserToResponse(user),
    };
  }

  async refresh(rawToken: string): Promise<AuthTokenPair> {
    const tokenHash = this.hashToken(rawToken);
    const storedToken =
      await this.authRepository.findActiveRefreshToken(tokenHash);

    if (!storedToken) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.authRepository.findUserById(
      storedToken.tenant_id,
      storedToken.user_id,
    );
    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    await this.authRepository.revokeRefreshToken(storedToken.id);
    return this.generateTokenPair(user);
  }

  async logout(currentUser: RequestUser): Promise<void> {
    await this.authRepository.revokeAllUserRefreshTokens(
      currentUser.tenant_id,
      currentUser.id,
    );
  }

  async getMe(currentUser: RequestUser): Promise<MeResponse> {
    const user = await this.authRepository.findUserById(
      currentUser.tenant_id,
      currentUser.id,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.mapUserToMeResponse(user);
  }

  async updateMe(
    currentUser: RequestUser,
    dto: UpdateMeDto,
  ): Promise<MeResponse> {
    const updateData: Partial<Pick<User, 'first_name' | 'last_name' | 'password_hash'>> = {};

    if (dto.first_name !== undefined) updateData.first_name = dto.first_name;
    if (dto.last_name !== undefined) updateData.last_name = dto.last_name;
    if (dto.password !== undefined) {
      updateData.password_hash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    }

    const updated = await this.authRepository.updateUser(
      currentUser.tenant_id,
      currentUser.id,
      updateData,
    );

    return this.mapUserToMeResponse(updated);
  }

  private async verifyPassword(
    plainText: string,
    hash: string,
  ): Promise<void> {
    const isValid = await bcrypt.compare(plainText, hash);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }
  }

  private async generateTokenPair(user: User): Promise<AuthTokenPair> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      tenant_id: user.tenant_id,
    };

    const access_token = this.jwtService.sign(payload);
    const rawRefreshToken = randomUUID();
    const tokenHash = this.hashToken(rawRefreshToken);

    const expiresAt = this.buildRefreshTokenExpiry();

    await this.authRepository.createRefreshToken({
      tenantId: user.tenant_id,
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return { access_token, refresh_token: rawRefreshToken };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private buildRefreshTokenExpiry(): Date {
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + REFRESH_TOKEN_TTL_DAYS);
    return expiry;
  }

  private mapUserToResponse(user: User): LoginResponse['user'] {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      tenant_id: user.tenant_id,
    };
  }

  private mapUserToMeResponse(user: User): MeResponse {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      first_name: user.first_name,
      last_name: user.last_name,
      tenant_id: user.tenant_id,
      is_verified: user.is_verified,
      last_login_at: user.last_login_at,
    };
  }
}
