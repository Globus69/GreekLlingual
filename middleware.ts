import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware - Server-side IP Whitelisting for Admin Routes
 *
 * Security: IP-Check läuft auf dem Server, nicht im Browser
 * - Umgeht Client-Side Manipulation
 * - Nutzt x-forwarded-for Header (Vercel/Production)
 * - Nur für /login Route (Admin-Login)
 */
export function middleware(request: NextRequest) {
  // IP-Whitelisting nur für Admin-Login Route
  if (request.nextUrl.pathname === '/login') {
    const allowedIPs = process.env.ADMIN_ALLOWED_IPS || '';

    // Wenn keine Whitelist konfiguriert → alle IPs erlauben (Development)
    if (!allowedIPs.trim()) {
      return NextResponse.next();
    }

    // Client-IP aus Request Headers extrahieren
    // Vercel/Production: x-forwarded-for Header
    // Local Development: x-real-ip oder direkt aus req
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');

    // Parse IP-Adresse (x-forwarded-for kann mehrere IPs enthalten)
    let clientIp: string | null = null;
    if (forwardedFor) {
      // Nimm die erste IP aus der Liste (echte Client-IP)
      clientIp = forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      clientIp = realIp;
    }

    // Keine IP erkannt → Request blockieren (fail-closed)
    if (!clientIp) {
      console.warn('[Middleware] IP-Whitelisting: Client-IP nicht erkannt');
      return new NextResponse(
        JSON.stringify({
          error: 'Access denied',
          message: 'Could not determine client IP address',
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Parse Whitelist
    const whitelist = allowedIPs
      .split(',')
      .map(ip => ip.trim())
      .filter(ip => ip.length > 0);

    // IP-Check
    if (!whitelist.includes(clientIp)) {
      console.warn(
        `[Middleware] IP-Whitelisting: Access denied for IP ${clientIp}. ` +
        `Allowed IPs: ${whitelist.join(', ')}`
      );

      return new NextResponse(
        JSON.stringify({
          error: 'Access denied',
          message: 'Your IP address is not whitelisted for admin access',
          ip: clientIp,
        }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // IP ist in Whitelist → Request erlauben
    console.log(`[Middleware] IP-Whitelisting: Access granted for IP ${clientIp}`);
  }

  return NextResponse.next();
}

/**
 * Middleware Config - Auf welche Routes soll Middleware angewendet werden?
 *
 * Matchers:
 * - /login → Admin-Login (IP-Whitelisting)
 *
 * Excluded:
 * - /api/* → API-Routes haben eigene Security
 * - /_next/* → Next.js interne Routen
 * - /static/* → Statische Assets
 */
export const config = {
  matcher: [
    '/login',
    // Weitere Admin-Routes können hier hinzugefügt werden:
    // '/admin/:path*',
  ],
};
