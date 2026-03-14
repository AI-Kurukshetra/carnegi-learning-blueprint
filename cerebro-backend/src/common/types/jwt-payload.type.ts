export interface JwtPayload {
  sub: string; // user.id
  email: string;
  role: string;
  tenant_id: string;
}
