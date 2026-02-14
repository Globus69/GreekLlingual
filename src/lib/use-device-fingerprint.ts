/**
 * Device Fingerprinting mit FingerprintJS
 *
 * Generiert einen eindeutigen Browser-Fingerprint als unsichtbaren 2. Faktor
 * Warnt bei Login von neuem Gerät
 */

import FingerprintJS from '@fingerprintjs/fingerprintjs';

let fpPromise: Promise<any> | null = null;

/**
 * Generiert Browser-Fingerprint
 *
 * @returns {string} Eindeutiger Fingerprint (visitorId)
 *
 * @example
 * const fingerprint = await getDeviceFingerprint();
 * // Returns: "3c8f7e9a2b1d4e5f"
 */
export async function getDeviceFingerprint(): Promise<string> {
  try {
    // Lazy Load - nur einmal initialisieren
    if (!fpPromise) {
      fpPromise = FingerprintJS.load();
    }

    const fp = await fpPromise;
    const result = await fp.get();

    return result.visitorId;
  } catch (error) {
    console.error('Fingerprint generation failed:', error);
    // Fallback: Generiere pseudo-unique ID aus UserAgent + Screen
    return generateFallbackFingerprint();
  }
}

/**
 * Fallback-Fingerprint ohne FingerprintJS
 *
 * Nutzt UserAgent + Screen-Dimensionen + Timezone
 */
function generateFallbackFingerprint(): string {
  const ua = navigator.userAgent || 'unknown';
  const screen = `${window.screen.width}x${window.screen.height}`;
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const lang = navigator.language || 'en';

  const data = `${ua}|${screen}|${tz}|${lang}`;

  // Einfacher Hash (nicht kryptographisch sicher, aber ausreichend)
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16);
}

/**
 * Prüft ob Fingerprint mit gespeichertem übereinstimmt
 *
 * @param storedFingerprint - Gespeicherter Fingerprint aus DB
 * @returns {boolean} True wenn Match
 */
export function isFingerprintMatch(
  currentFingerprint: string,
  storedFingerprint: string | null
): boolean {
  if (!storedFingerprint) {
    // Erster Login - kein Fingerprint gespeichert
    return true;
  }

  return currentFingerprint === storedFingerprint;
}
