/**
 * JWT Utilities - Server-side only
 *
 * Handles JWT token creation and verification for session management.
 * Uses HMAC SHA-256 for signing.
 *
 * SECURITY:
 * - JWT_SECRET must be set in .env.local (never commit!)
 * - Tokens are stored in httpOnly cookies (client cannot access)
 * - Short expiration times (Admin: 15min, Student: 24h)
 */

import { SignJWT, jwtVerify } from 'jose';

// Session payload interface
export interface SessionPayload {
  userId: string;
  role: 'admin' | 'student';
  name: string;
  email: string;
  level?: string;
  difficulty?: string;
  performance_index?: string;
  preferred_locale?: 'en' | 'ru' | 'el' | 'de' | 'es';
}

// JWT expiration times
export const ADMIN_SESSION_DURATION = 15 * 60; // 15 minutes in seconds
export const STUDENT_SESSION_DURATION = 24 * 60 * 60; // 24 hours in seconds

/**
 * Get JWT secret from environment
 * Throws error if not set (fail-closed)
 */
function getJWTSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error('JWT_SECRET environment variable not set');
  }

  // Convert string to Uint8Array for jose library
  return new TextEncoder().encode(secret);
}

/**
 * Create a signed JWT token for session management
 *
 * @param payload - User session data
 * @returns Signed JWT token string
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getJWTSecret();

  // Calculate expiration based on role
  const expirationTime = payload.role === 'admin'
    ? ADMIN_SESSION_DURATION
    : STUDENT_SESSION_DURATION;

  // Create JWT with payload
  const token = await new SignJWT({
    userId: payload.userId,
    role: payload.role,
    name: payload.name,
    email: payload.email,
    level: payload.level,
    difficulty: payload.difficulty,
    performance_index: payload.performance_index,
    preferred_locale: payload.preferred_locale,
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${expirationTime}s`) // e.g., "900s" or "86400s"
    .sign(secret);

  return token;
}

/**
 * Verify and decode a JWT session token
 *
 * @param token - JWT token from cookie
 * @returns Decoded session payload or null if invalid/expired
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  try {
    const secret = getJWTSecret();

    // Verify signature and expiration
    const { payload } = await jwtVerify(token, secret, {
      algorithms: ['HS256'],
    });

    // Extract session data
    return {
      userId: payload.userId as string,
      role: payload.role as 'admin' | 'student',
      name: payload.name as string,
      email: payload.email as string,
      level: payload.level as string | undefined,
      difficulty: payload.difficulty as string | undefined,
      performance_index: payload.performance_index as string | undefined,
      preferred_locale: payload.preferred_locale as 'en' | 'ru' | 'el' | 'de' | 'es' | undefined,
    };
  } catch (error) {
    // Token invalid, expired, or tampered
    console.warn('JWT verification failed:', error instanceof Error ? error.message : 'Unknown error');
    return null;
  }
}

/**
 * Get session duration in seconds based on role
 *
 * @param role - User role
 * @returns Session duration in seconds
 */
export function getSessionDuration(role: 'admin' | 'student'): number {
  return role === 'admin' ? ADMIN_SESSION_DURATION : STUDENT_SESSION_DURATION;
}
