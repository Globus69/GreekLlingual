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
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-gray-200 safe-area-inset-bottom z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-4">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.key}
              href={tab.href}
              className={`
                flex flex-col items-center justify-center
                min-w-[60px] h-full
                transition-all duration-200
                ${active ? 'text-blue-600' : 'text-gray-500'}
              `}
            >
              <span className={`text-2xl mb-1 transition-transform ${active ? 'scale-110' : 'scale-100'}`}>
                {tab.icon}
              </span>
              <span className={`text-xs font-medium ${active ? 'font-bold' : ''}`}>
                {tab.label}
              </span>
              {active && (
                <div className="absolute bottom-0 h-1 w-12 bg-blue-600 rounded-t-full" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
