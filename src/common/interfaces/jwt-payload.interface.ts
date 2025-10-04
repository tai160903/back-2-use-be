export interface JwtPayload {
  _id: string;
  role: string;
  iat?: number; // issued at
  exp?: number; // expiry
}
