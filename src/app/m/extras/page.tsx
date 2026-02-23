'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function MobileExtrasPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  // Loading state
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#0F0F11'
      }}>
        <div style={{ fontSize: '20px', color: 'white' }}>Loading...</div>
      </div>
    );
  }

  // Note: No admin check here - security is handled by:
  // 1. Admin-Login-Dialog in MobileBottomNav.tsx (prevents non-admin access)
  // 2. Server-side RPC verification (verify_user_pin checks admin role)

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F0F11', paddingBottom: '80px' }}>
      {/* Header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backgroundColor: 'rgba(28, 28, 30, 0.95)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '11px',
          paddingTop: 'calc(11px + env(safe-area-inset-top))',
        }}
      >
        <div style={{ maxWidth: '448px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            onClick={() => router.back()}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: 0,
              color: 'white',
            }}
          >
            ←
          </button>
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>🔧 Extras</h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '448px', margin: '0 auto', padding: '16px' }}>
        {/* Admin Badge */}
        <div
          style={{
            backgroundColor: 'rgba(255, 204, 0, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '24px',
            border: '1px solid rgba(255, 204, 0, 0.3)',
          }}
        >
          <div style={{ fontSize: '14px', color: 'rgba(255, 204, 0, 0.7)', marginBottom: '8px' }}>Admin Only</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#FFCC00', marginBottom: '4px' }}>
            Extra Features
          </div>
          <div style={{ fontSize: '14px', color: 'rgba(255, 204, 0, 0.8)' }}>
            Advanced tools and experimental features
          </div>
        </div>

        {/* Section: Moved from Dashboard */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#8E8E93', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Learning Features
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {/* Moved from Dashboard: #1, #6, #7, #9, #10, #11 */}
            <ModuleTile
              debugId="1"
              icon="👩‍🏫"
              title="Magic Round"
              subtitle="Your lesson"
              color="purple"
              onClick={() => alert('Magic Round - Coming soon!')}
            />
            <ModuleTile
              debugId="6"
              icon="⚡"
              title="Quick Lesson"
              subtitle="20 min session"
              color="blue"
              onClick={() => alert('Quick Lesson - Coming soon!')}
            />
            <ModuleTile
              debugId="7"
              icon="📚"
              title="Short Stories"
              subtitle="Read & learn"
              color="green"
              onClick={() => alert('Short Stories - Coming soon!')}
            />
            <ModuleTile
              debugId="9"
              icon="👂"
              title="Listening"
              subtitle="Audio practice"
              color="blue"
              onClick={() => alert('Listening - Coming soon!')}
            />
            <ModuleTile
              debugId="10"
              icon="🗣️"
              title="Pronunciation"
              subtitle="Speak Greek"
              color="purple"
              onClick={() => alert('Pronunciation - Coming soon!')}
            />
            <ModuleTile
              debugId="11"
              icon="📝"
              title="Test"
              subtitle="Check progress"
              color="orange"
              onClick={() => alert('Test - Coming soon!')}
            />
          </div>
        </div>

        {/* Section: Admin Tools */}
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 'bold', color: '#8E8E93', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Admin Tools
          </h2>
          <ExtraButton
            icon="🧪"
            title="Experimental Features"
            subtitle="Test new functionality"
            color="purple"
            onClick={() => alert('Experimental Features - Coming soon!')}
          />
          <ExtraButton
            icon="🔍"
            title="Debug Tools"
            subtitle="System diagnostics"
            color="blue"
            onClick={() => alert('Debug Tools - Coming soon!')}
          />
          <ExtraButton
            icon="📊"
            title="Analytics"
            subtitle="Advanced statistics"
            color="green"
            onClick={() => alert('Analytics - Coming soon!')}
          />
          <ExtraButton
            icon="🎨"
            title="Theme Editor"
            subtitle="Customize appearance"
            color="orange"
            onClick={() => alert('Theme Editor - Coming soon!')}
          />
          <ExtraButton
            icon="🔧"
            title="System Settings"
            subtitle="Advanced configuration"
            color="purple"
            onClick={() => alert('System Settings - Coming soon!')}
          />
          <ExtraButton
            icon="💾"
            title="Data Export"
            subtitle="Backup & export data"
            color="blue"
            onClick={() => alert('Data Export - Coming soon!')}
          />
        </div>

        {/* Info Box */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            marginTop: '24px',
          }}
        >
          <div style={{ fontSize: '12px', color: '#8E8E93', lineHeight: '1.6' }}>
            <strong style={{ color: '#FFCC00' }}>Note:</strong> These features are experimental and may not be fully functional.
            Use at your own risk. Regular backups are recommended.
          </div>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div
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
        <div style={{ maxWidth: '448px', margin: '0 auto', display: 'flex', justifyContent: 'space-around' }}>
          <button
            onClick={() => router.push('/m')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '24px' }}>🏠</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#8E8E93' }}>Home</span>
          </button>
          <button
            onClick={() => router.push('/m/stats')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '24px' }}>📊</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#8E8E93' }}>Stats</span>
          </button>
          <button
            onClick={() => router.push('/m/settings')}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              padding: '8px 16px',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '24px' }}>⚙️</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#8E8E93' }}>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

// ModuleTile Component (for Dashboard features moved to Extras)
interface ModuleTileProps {
  debugId?: string;
  icon: string;
  title: string;
  subtitle: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
  disabled?: boolean;
  onClick: () => void;
}

function ModuleTile({ debugId, icon, title, subtitle, color, disabled, onClick }: ModuleTileProps) {
  const colors = {
    blue: { bg: 'rgba(0, 122, 255, 0.25)', border: 'rgba(0, 122, 255, 0.5)', text: '#007AFF' },
    green: { bg: 'rgba(52, 199, 89, 0.25)', border: 'rgba(52, 199, 89, 0.5)', text: '#34C759' },
    orange: { bg: 'rgba(255, 159, 10, 0.25)', border: 'rgba(255, 159, 10, 0.5)', text: '#FF9F0A' },
    purple: { bg: 'rgba(191, 90, 242, 0.25)', border: 'rgba(191, 90, 242, 0.5)', text: '#BF5AF2' },
  };

  const c = colors[color];

  return (
    <button
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      style={{
        width: '100%',
        minHeight: '48px',
        padding: '8px 10px',
        borderRadius: '12px',
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'transform 0.2s ease, opacity 0.2s ease',
        position: 'relative'
      }}
      onMouseDown={(e) => {
        if (!disabled) {
          e.currentTarget.style.transform = 'scale(0.98)';
        }
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      {/* DEBUG: Button ID */}
      {debugId && (
        <span style={{
          position: 'absolute',
          top: '4px',
          right: '4px',
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          color: c.text,
          fontSize: '9px',
          fontWeight: 'bold',
          padding: '2px 5px',
          borderRadius: '4px',
          lineHeight: '1'
        }}>
          #{debugId}
        </span>
      )}
      <span style={{ fontSize: '24px' }}>{icon}</span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontWeight: 'bold', fontSize: '13px', color: 'white', lineHeight: '1.2' }}>{title}</div>
        <div style={{ fontSize: '10px', color: 'rgba(255, 255, 255, 0.65)', marginTop: '1px' }}>{subtitle}</div>
      </div>
      {!disabled && (
        <span style={{ fontSize: '16px', color: c.text, opacity: 0.7 }}>→</span>
      )}
    </button>
  );
}

interface ExtraButtonProps {
  icon: string;
  title: string;
  subtitle: string;
  color: 'blue' | 'green' | 'orange' | 'purple';
  onClick: () => void;
}

function ExtraButton({ icon, title, subtitle, color, onClick }: ExtraButtonProps) {
  const colors = {
    blue: { bg: 'rgba(0, 122, 255, 0.15)', border: 'rgba(0, 122, 255, 0.3)', text: '#007AFF' },
    green: { bg: 'rgba(52, 199, 89, 0.15)', border: 'rgba(52, 199, 89, 0.3)', text: '#34C759' },
    orange: { bg: 'rgba(255, 159, 10, 0.15)', border: 'rgba(255, 159, 10, 0.3)', text: '#FF9F0A' },
    purple: { bg: 'rgba(191, 90, 242, 0.15)', border: 'rgba(191, 90, 242, 0.3)', text: '#BF5AF2' },
  };

  const c = colors[color];

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px',
        backgroundColor: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'transform 0.2s ease, background-color 0.2s ease',
      }}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.98)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
    >
      <span style={{ fontSize: '28px' }}>{icon}</span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.65)' }}>{subtitle}</div>
      </div>
      <span style={{ fontSize: '16px', color: c.text, opacity: 0.7 }}>→</span>
    </button>
  );
}
