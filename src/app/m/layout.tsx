'use client';

import MobileBottomNav from '@/components/mobile/MobileBottomNav';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900"
      style={{
        height: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Content Area - Scrollable */}
      <main
        className="flex-1 scrollable"
        style={{
          overflowY: 'auto',
          overflowX: 'hidden',
          WebkitOverflowScrolling: 'touch',
          paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))',
        }}
      >
        {children}
      </main>

      {/* Fixed Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
