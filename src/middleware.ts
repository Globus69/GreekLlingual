/**
 * Next.js Edge Middleware - Rate Limiting + Device-Detection
 *
 * Funktionen:
 * 1. Schützt Login-Routen vor Brute-Force-Angriffen
 * 2. Device-Detection: Redirect nach Login basierend auf Gerät
 * 3. Wird auf Edge Runtime ausgeführt (schnelle Antwortzeiten)
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitLogin, rateLimitAdmin, getClientIP } from '@/lib/rateLimit';
import { isMobileDevice } from '@/lib/device-utils';

/**
 * Middleware für Rate Limiting + Device-Detection
 *
 * Geschützte Routen:
 * - /login-pin (Schüler-Login): 10 Versuche/Minute
 * - /login (Admin-Login): 3 Versuche/5 Minuten
 *
 * Device-Detection:
 * - /redirect-after-login → /m (Mobile) oder /dashboard (Desktop)
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ========================================
  // 1. DEVICE-DETECTION: Redirect nach Login
  // ========================================
  if (pathname === '/redirect-after-login') {
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = isMobileDevice(userAgent);

    if (isMobile) {
      // Mobile → /m Dashboard
      return NextResponse.redirect(new URL('/m', request.url));
    } else {
      // Desktop → /dashboard
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ========================================
  // 2. RATE LIMITING: Login-Routen
  // ========================================

  // Nur Login-Routen schützen
  if (pathname === '/login-pin' || pathname === '/login') {
    const clientIp = getClientIP(request);

    // Admin-Login: strengeres Rate Limiting (3/5min)
    const rateLimit = pathname === '/login' ? rateLimitAdmin : rateLimitLogin;

    // Rate Limit prüfen
    const { success, limit, remaining, reset } = await rateLimit.limit(clientIp);

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
 * - Schützt nur /login und /login-pin (Rate Limiting)
 * - /redirect-after-login (Device-Detection)
 * - Ignoriert statische Assets (_next/*, /api/*, etc.)
 */
export const config = {
  matcher: [
    '/login',
    '/login-pin',
    '/redirect-after-login',
  ],
};
