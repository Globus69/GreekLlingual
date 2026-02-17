'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileBottomNav() {
  const pathname = usePathname();

  const tabs = [
    { href: '/m', icon: '🏠', label: 'Home', key: 'home' },
    { href: '/m/stats', icon: '📊', label: 'Stats', key: 'stats' },
    { href: '/m/settings', icon: '⚙️', label: 'Settings', key: 'settings' },
  ];

  const isActive = (href: string) => {
    if (href === '/m') {
      return pathname === '/m';
    }
    return pathname.startsWith(href);
  };

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        backgroundColor: 'rgba(28, 28, 30, 0.95)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '8px 16px 12px',
      }}
    >
      <div style={{
        maxWidth: '448px',
        margin: '0 auto',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
      }}>
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '4px',
                padding: '8px 16px',
                minWidth: '60px',
                textDecoration: 'none',
                transition: 'transform 0.2s ease',
                transform: active ? 'scale(1.05)' : 'scale(1)',
              }}
            >
              <span style={{
                fontSize: '24px',
                lineHeight: 1,
              }}>
                {tab.icon}
              </span>
              <span style={{
                fontSize: '11px',
                fontWeight: active ? '600' : '500',
                color: active ? '#007AFF' : '#8E8E93',
                whiteSpace: 'nowrap',
              }}>
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
