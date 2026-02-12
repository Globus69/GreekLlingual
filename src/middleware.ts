/**
 * Next.js Edge Middleware - Rate Limiting
 *
 * Schützt Login-Routen vor Brute-Force-Angriffen
 * Wird auf Edge Runtime ausgeführt (schnelle Antwortzeiten)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { checkRateLimit, getClientIP } from '@/lib/rateLimit';

/**
 * Middleware für Rate Limiting auf Login-Routen
 *
 * Geschützte Routen:
 * - /login-pin (Schüler-Login)
 * - /login (Admin-Login)
 *
 * Rate Limit: 10 Versuche/Minute pro IP
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Nur Login-Routen schützen
  if (pathname === '/login-pin' || pathname === '/login') {
    const clientIp = getClientIP(request);

    // Rate Limit prüfen
    const { success, limit, remaining, reset } = await checkRateLimit(clientIp);

    if (!success) {
      // Rate Limit überschritten
      const retryAfter = Math.ceil(reset / 1000); // Sekunden bis Reset

      // JSON-Response mit Fehlerdetails
      return new NextResponse(
        JSON.stringify({
          error: 'Too many login attempts',
          message: `Rate limit exceeded. Try again in ${retryAfter} seconds.`,
          retryAfter,
          limit,
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': retryAfter.toString(),
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(Date.now() + reset).toISOString(),
          },
        }
      );
    }

    // Rate Limit OK - füge Header hinzu für Monitoring
    const response = NextResponse.next();
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', new Date(Date.now() + reset).toISOString());

    return response;
  }

  // Andere Routen: kein Rate Limiting
  return NextResponse.next();
}

/**
 * Middleware-Konfiguration
 *
 * matcher: Definiert auf welchen Routen die Middleware läuft
 * - Schützt nur /login und /login-pin
 * - Ignoriert statische Assets (_next/*, /api/*, etc.)
 */
export const config = {
  matcher: [
    '/login',
    '/login-pin',
  ],
};
