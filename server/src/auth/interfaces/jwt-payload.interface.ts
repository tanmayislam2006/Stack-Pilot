export interface JwtPayload {
  userId: string;
  role: string;
  name: string;
  email: string;
  status: string;
  isDeleted: boolean;
  emailVerified: boolean;
}
