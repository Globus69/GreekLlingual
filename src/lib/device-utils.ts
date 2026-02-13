/**
 * Device Detection Utilities
 *
 * Erkennt Gerätetyp (Mobile vs. Desktop) basierend auf User-Agent
 * Wird in Middleware und Client-Komponenten verwendet
 */

/**
 * Prüft ob User-Agent von einem mobilen Gerät stammt
 *
 * Erkennt:
 * - Smartphones (iPhone, Android, Windows Phone)
 * - Tablets (iPad, Android Tablets) - optional
 * - Mobile Browser (Safari Mobile, Chrome Mobile, etc.)
 *
 * @param userAgent - Browser User-Agent String
 * @param includeTablets - Tablets als "mobile" behandeln (default: true)
 * @returns true wenn mobiles Gerät erkannt wurde
 */
export function isMobileDevice(userAgent: string, includeTablets: boolean = true): boolean {
  if (!userAgent) return false;

  const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Android(?!.*Mobile)/i;

  // Smartphones
  if (mobileRegex.test(userAgent)) {
    return true;
  }

  // Tablets (optional)
  if (includeTablets && tabletRegex.test(userAgent)) {
    return true;
  }

  return false;
}

/**
 * Erkennt spezifischen Gerätetyp
 *
 * @param userAgent - Browser User-Agent String
 * @returns 'mobile' | 'tablet' | 'desktop'
 */
export function getDeviceType(userAgent: string): 'mobile' | 'tablet' | 'desktop' {
  if (!userAgent) return 'desktop';

  const mobileRegex = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
  const tabletRegex = /iPad|Android(?!.*Mobile)/i;

  if (mobileRegex.test(userAgent)) {
    return 'mobile';
  }

  if (tabletRegex.test(userAgent)) {
    return 'tablet';
  }

  return 'desktop';
}

/**
 * Prüft ob iOS-Gerät (iPhone, iPad)
 */
export function isIOS(userAgent: string): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent);
}

/**
 * Prüft ob Android-Gerät
 */
export function isAndroid(userAgent: string): boolean {
  return /Android/i.test(userAgent);
}

/**
 * Client-seitiges Device-Detection (Browser)
 *
 * Verwendung in React Components:
 * ```tsx
 * const isMobile = useIsMobile();
 * ```
 */
export function getClientDeviceType(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop';
  return getDeviceType(window.navigator.userAgent);
}

/**
 * React Hook für Device-Detection
 *
 * @returns boolean - true wenn mobile/tablet
 */
export function useIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return isMobileDevice(window.navigator.userAgent);
}
