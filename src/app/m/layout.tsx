'use client';

import MobileBottomNav from '@/components/mobile/MobileBottomNav';

export default function MobileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen pb-16 bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Content Area with padding for Bottom Nav */}
      <main className="pb-safe">
        {children}
      </main>

      {/* Fixed Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}
