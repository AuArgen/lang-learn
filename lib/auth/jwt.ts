import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export interface UserJwtPayload extends JWTPayload {
  userId: string;
  role: 'USER' | 'TEACHER' | 'ADMIN';
  subscriptionExpiresAt: Date | string | null;
}

export const getJwtSecretKey = () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
};

export async function signJwtToken(payload: UserJwtPayload): Promise<string> {
  const secret = getJwtSecretKey();
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('30d') // Token valid for 30 days
    .sign(secret);
}

export async function verifyJwtToken(token: string): Promise<UserJwtPayload | null> {
  try {
    const secret = getJwtSecretKey();
    const { payload } = await jwtVerify(token, secret);
    return payload as UserJwtPayload;
  } catch (error) {
    console.error('JWT Verification Error:', error);
    return null;
  }
}
