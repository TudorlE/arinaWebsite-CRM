/**
 * Authentication utilities using jose (Web Crypto compatible JWT).
 */
import { SignJWT, jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'arry-music-crm-default-secret-change-in-production'
);

export interface JWTPayload {
  userId: number;
  email: string;
  role: string | null;
}

/** Creates a signed JWT that expires in 7 days */
export async function signToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(SECRET);
}

/** Verifies a JWT and returns the payload, or null if invalid */
export async function verifyToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as JWTPayload;
  } catch {
    return null;
  }
}

/** Reads the auth-token cookie and returns the payload */
export async function getAuthUser(request: NextRequest): Promise<JWTPayload | null> {
  const token = request.cookies.get('auth-token')?.value;
  if (!token) return null;
  return verifyToken(token);
}
