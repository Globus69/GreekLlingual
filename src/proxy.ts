import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { rateLimitLogin, rateLimitAdmin, getClientIP } from '@/lib/rate-limit';
import { isMobileDevice } from '@/lib/device-utils';

/**
 * GreekLingua Middleware
 *
 * Security Functions:
 * 1. IP Whitelisting for Admin-Login (/login)
 * 2. Rate Limiting for all Logins (/login, /login-pin)
 * 3. Device Detection & Redirect (/redirect-after-login)
 */
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ==========================================================
  // 1. IP WHITELISTING (Admin Route Protection)
  // ==========================================================
  if (pathname === '/login') {
    const allowedIPs = process.env.ADMIN_ALLOWED_IPS || '';

    // Only enforce if a whitelist is actually configured
    if (allowedIPs.trim()) {
      const clientIp = getClientIP(request);

      // Block if IP cannot be detected
      if (!clientIp || clientIp === 'unknown') {
        console.warn('[Middleware] IP-Whitelisting: Client-IP not detected');
        return new NextResponse(
          JSON.stringify({
            error: 'Access denied',
            message: 'Could not determine client IP address',
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const whitelist = allowedIPs
        .split(',')
        .map(ip => ip.trim())
        .filter(ip => ip.length > 0);

      if (!whitelist.includes(clientIp)) {
        console.warn(`[Middleware] IP-Whitelisting: Access denied for IP ${clientIp}`);
        return new NextResponse(
          JSON.stringify({
            error: 'Access denied',
            message: 'Your IP address is not whitelisted for admin access',
            ip: clientIp,
          }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }
      console.log(`[Middleware] IP-Whitelisting: Access granted for IP ${clientIp}`);
    }
  }

  // ==========================================================
  // 2. DEVICE-DETECTION (Redirect after Login)
  // ==========================================================
  if (pathname === '/redirect-after-login') {
    const userAgent = request.headers.get('user-agent') || '';
    const isMobile = isMobileDevice(userAgent);

    if (isMobile) {
      return NextResponse.redirect(new URL('/m', request.url));
    } else {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  // ==========================================================
  // 3. RATE LIMITING (Brute-Force Protection)
  // ==========================================================
  if ((pathname === '/login-pin' || pathname === '/login') && request.method === 'POST') {
    const clientIp = getClientIP(request);
    const rateLimit = pathname === '/login' ? rateLimitAdmin : rateLimitLogin;

    try {
      const { success, limit, remaining, reset } = await rateLimit.limit(clientIp);

      if (!success) {
        const retryAfter = Math.ceil(reset / 1000);
        console.warn(`[Middleware] Rate Limit reached for ${clientIp} on ${pathname}`);
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
            },
          }
        );
      }

      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', limit.toString());
      response.headers.set('X-RateLimit-Remaining', remaining.toString());
      return response;
    } catch (error) {
      console.error('[Middleware] Rate limiter error:', error);
      // Fail-closed for security
      return new NextResponse(JSON.stringify({ error: 'Security service unavailable' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  return NextResponse.next();
}

/**
 * Middleware Configuration
 */
export const config = {
  matcher: [
    '/login',
    '/login-pin',
    '/redirect-after-login',
  ],
};
