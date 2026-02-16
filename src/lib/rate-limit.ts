/**
 * Rate Limiting mit Upstash Redis
 *
 * Schützt Login-Endpunkte vor Brute-Force-Angriffen:
 * - Max. 10 Versuche pro Minute pro IP
 * - Sliding Window Algorithmus
 * - Analytics aktiviert für Monitoring
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// Upstash Redis-Client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || process.env.UPSTASH_REDIS_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || process.env.UPSTASH_REDIS_TOKEN || '',
});

/**
 * Rate Limiter für Login-Versuche (Schüler)
 *
 * @limit 10 requests per minute per IP
 * @algorithm Sliding Window (präzise, keine Burst-Spitzen)
 */
export const rateLimitLogin = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, '1 m'),
  analytics: true,
  prefix: 'greeklingua:ratelimit',
});

/**
 * Rate Limiter für Admin-Login (strenger)
 *
 * @limit 3 requests per 5 minutes per IP
 * @algorithm Sliding Window
 */
export const rateLimitAdmin = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(3, '5 m'),
  analytics: true,
  prefix: 'greeklingua:ratelimit:admin',
});

/**
 * Prüft ob IP unter Rate Limit liegt
 *
 * @param identifier - IP-Adresse oder eindeutiger Identifier
 * @returns {success, limit, remaining, reset}
 *
 * @example
 * const { success, remaining } = await checkRateLimit('192.168.1.1');
 * if (!success) {
 *   throw new Error(`Rate limit exceeded. Try again in ${Math.ceil(reset / 1000)}s`);
 * }
 */
export async function checkRateLimit(identifier: string) {
  try {
    const result = await rateLimitLogin.limit(identifier);
    return result;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // SECURITY: Fail-closed – Bei Redis-Fehler blocken wir Requests (verhindert Brute-Force)
    return { success: false, limit: 10, remaining: 0, reset: 60000, pending: Promise.resolve() };
  }
}

/**
 * Prüft ob Admin-IP unter Rate Limit liegt (strengere Limits)
 *
 * @param identifier - IP-Adresse oder eindeutiger Identifier
 * @returns {success, limit, remaining, reset}
 *
 * @example
 * const { success } = await checkRateLimitAdmin('192.168.1.1');
 * if (!success) {
 *   throw new Error('Too many admin login attempts. Try again later.');
 * }
 */
export async function checkRateLimitAdmin(identifier: string) {
  try {
    const result = await rateLimitAdmin.limit(identifier);
    return result;
  } catch (error) {
    console.error('Admin rate limit check failed:', error);
    // SECURITY: Fail-closed – Bei Redis-Fehler blocken wir Admin-Requests (extra streng)
    return { success: false, limit: 3, remaining: 0, reset: 300000, pending: Promise.resolve() };
  }
}

/**
 * Hilfsfunktion: Extrahiert Client-IP aus Next.js Request
 *
 * Prüft Header in dieser Reihenfolge:
 * 1. x-forwarded-for (Proxy/CDN)
 * 2. x-real-ip (Nginx)
 * 3. connection.remoteAddress (Direct)
 */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  // Fallback für Development
  return 'unknown';
}
