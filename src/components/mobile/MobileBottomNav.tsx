'use client';

import { memo, useCallback, useMemo, CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Stable tabs configuration (moved outside component to prevent recreation)
const TABS = [
  { href: '/m', icon: '🏠', label: 'Home', key: 'home' },
  { href: '/m/stats', icon: '📊', label: 'Stats', key: 'stats' },
  { href: '/m/settings', icon: '⚙️', label: 'Settings', key: 'settings' },
] as const;

// Stable style objects (moved outside component to prevent recreation)
const NAV_STYLE: CSSProperties = {
  position: 'fixed',
  bottom: 0,
  left: 0,
  right: 0,
  zIndex: 50,
  backgroundColor: 'rgba(28, 28, 30, 0.95)',
  backdropFilter: 'blur(20px)',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  padding: '8px 16px 12px',
};

const CONTAINER_STYLE: CSSProperties = {
  maxWidth: '448px',
  margin: '0 auto',
  display: 'flex',
  justifyContent: 'space-around',
  alignItems: 'center',
};

const LINK_BASE_STYLE: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '4px',
  padding: '8px 16px',
  minWidth: '60px',
  textDecoration: 'none',
  transition: 'transform 0.2s ease',
};

const ICON_STYLE: CSSProperties = {
  fontSize: '24px',
  lineHeight: 1,
};

function MobileBottomNav() {
  const pathname = usePathname();

  // Memoized isActive function
  const isActive = useCallback((href: string) => {
    if (href === '/m') {
      return pathname === '/m';
    }
    return pathname.startsWith(href);
  }, [pathname]);

  // Memoized active states for all tabs
  const activeStates = useMemo(() => {
    return TABS.map(tab => ({
      key: tab.key,
      active: isActive(tab.href),
    }));
  }, [isActive]);

  // Memoized style generator for links
  const getLinkStyle = useCallback((active: boolean): CSSProperties => {
    return {
      ...LINK_BASE_STYLE,
      transform: active ? 'scale(1.05)' : 'scale(1)',
    };
  }, []);

  // Memoized style generator for labels
  const getLabelStyle = useCallback((active: boolean): CSSProperties => {
    return {
      fontSize: '11px',
      fontWeight: active ? '600' : '500',
      color: active ? '#007AFF' : '#8E8E93',
      whiteSpace: 'nowrap',
    };
  }, []);

  return (
    <nav style={NAV_STYLE}>
      <div style={CONTAINER_STYLE}>
        {TABS.map((tab, index) => {
          const active = activeStates[index].active;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              data-testid={`mobile-nav-${tab.key}`}
              style={getLinkStyle(active)}
            >
              <span style={ICON_STYLE}>
                {tab.icon}
              </span>
              <span style={getLabelStyle(active)}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// Wrap component in React.memo to prevent unnecessary re-renders
export default memo(MobileBottomNav);
