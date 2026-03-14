import { User } from '@prisma/client';

export interface EnrollmentInfo {
  enrollment_id: string;
  section_id: string;
  academic_year_id: string;
  is_active: boolean;
  enrolled_at: Date;
}

export interface SafeUser {
  id: string;
  tenant_id: string;
  email: string;
  role: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  is_verified: boolean;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  enrollment?: EnrollmentInfo;
  classroom_name?: string;
}

export function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    tenant_id: user.tenant_id,
    email: user.email,
    role: user.role,
    first_name: user.first_name,
    last_name: user.last_name,
    is_active: user.is_active,
    is_verified: user.is_verified,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
  };
}
