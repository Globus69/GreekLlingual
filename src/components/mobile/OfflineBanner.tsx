/**
 * Offline Banner Component
 *
 * Shows a banner when the app is offline (no internet connection).
 * Automatically hides when connection is restored.
 *
 * Mobile-optimized with touch-friendly design.
 */

'use client';

import { useOnlineStatus } from '@/hooks/use-mobile-cache';

export function OfflineBanner() {
  const { isOnline, wasOffline } = useOnlineStatus();

  // Show "back online" message briefly after reconnecting
  if (wasOffline && isOnline) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(52, 199, 89, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        <span style={{ fontSize: '18px' }}>🌐</span>
        <span>Back Online</span>
      </div>
    );
  }

  // Show offline banner
  if (!isOnline) {
    return (
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          backgroundColor: 'rgba(255, 149, 0, 0.95)',
          backdropFilter: 'blur(10px)',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          fontSize: '14px',
          fontWeight: '600',
          color: 'white',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        }}
      >
        <span style={{ fontSize: '18px' }}>📡</span>
        <span>Offline Mode</span>
        <span
          style={{
            marginLeft: '4px',
            fontSize: '12px',
            opacity: 0.8,
            fontWeight: '400',
          }}
        >
          • Using cached data
        </span>
      </div>
    );
  }

  return null;
}

/**
 * Cache Status Indicator
 * Small indicator showing if data is from cache
 */
interface CacheIndicatorProps {
  cached: boolean;
  style?: React.CSSProperties;
}

export function CacheIndicator({ cached, style }: CacheIndicatorProps) {
  if (!cached) return null;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '4px',
        padding: '4px 8px',
        borderRadius: '6px',
        backgroundColor: 'rgba(0, 122, 255, 0.15)',
        border: '1px solid rgba(0, 122, 255, 0.3)',
        fontSize: '11px',
        fontWeight: '600',
        color: '#007AFF',
        ...style,
      }}
    >
      <span>💾</span>
      <span>Cached</span>
    </div>
  );
}
