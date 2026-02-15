'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';

export default function MobileSettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      router.push('/login-pin');
    }
  };

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
          padding: '16px',
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
          <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>⚙️ Settings</h1>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '448px', margin: '0 auto', padding: '16px' }}>
        {/* User Info */}
        <div
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '16px',
            marginBottom: '16px',
          }}
        >
          <div style={{ fontSize: '14px', color: '#8E8E93', marginBottom: '8px' }}>Account</div>
          <div style={{ fontSize: '18px', fontWeight: 'bold', color: 'white', marginBottom: '4px' }}>
            {user?.name || 'Student'}
          </div>
          <div style={{ fontSize: '14px', color: '#8E8E93' }}>{user?.email || 'No email'}</div>
          <div style={{ fontSize: '14px', color: '#8E8E93', marginTop: '8px' }}>
            Level: <span style={{ color: '#FFD60A', fontWeight: 'bold' }}>{user?.level || 'A1'}</span>
          </div>
        </div>

        {/* Settings Options */}
        <div style={{ marginBottom: '16px' }}>
          <SettingButton
            icon="🌍"
            title="Language"
            subtitle="Change app language"
            onClick={() => alert('Language settings - Coming soon!')}
          />
          <SettingButton
            icon="🔔"
            title="Notifications"
            subtitle="Manage notifications"
            onClick={() => alert('Notification settings - Coming soon!')}
          />
          <SettingButton
            icon="🎨"
            title="Appearance"
            subtitle="Theme & display"
            onClick={() => alert('Appearance settings - Coming soon!')}
          />
          <SettingButton
            icon="📊"
            title="Learning Goals"
            subtitle="Set daily targets"
            onClick={() => alert('Learning goals - Coming soon!')}
          />
          <SettingButton
            icon="🔐"
            title="Privacy"
            subtitle="Data & security"
            onClick={() => alert('Privacy settings - Coming soon!')}
          />
        </div>

        {/* Danger Zone */}
        <div
          style={{
            backgroundColor: 'rgba(255, 59, 48, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '16px',
            border: '1px solid rgba(255, 59, 48, 0.3)',
          }}
        >
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'rgba(255, 59, 48, 0.2)',
              border: '1px solid rgba(255, 59, 48, 0.4)',
              borderRadius: '12px',
              color: '#FF3B30',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
            }}
          >
            🚪 Logout
          </button>
        </div>

        {/* App Info */}
        <div style={{ textAlign: 'center', marginTop: '32px', color: '#8E8E93', fontSize: '12px' }}>
          <div>GreekLingua Dashboard</div>
          <div style={{ marginTop: '4px' }}>Version 1.0.0 • Made with ❤️</div>
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
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#007AFF' }}>Settings</span>
          </button>
        </div>
      </div>
    </div>
  );
}

interface SettingButtonProps {
  icon: string;
  title: string;
  subtitle: string;
  onClick: () => void;
}

function SettingButton({ icon, title, subtitle, onClick }: SettingButtonProps) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '14px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        marginBottom: '8px',
        cursor: 'pointer',
        transition: 'background-color 0.2s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
      }}
    >
      <span style={{ fontSize: '28px' }}>{icon}</span>
      <div style={{ flex: 1, textAlign: 'left' }}>
        <div style={{ fontSize: '15px', fontWeight: 'bold', color: 'white', marginBottom: '2px' }}>{title}</div>
        <div style={{ fontSize: '12px', color: '#8E8E93' }}>{subtitle}</div>
      </div>
      <span style={{ fontSize: '16px', color: '#8E8E93' }}>→</span>
    </button>
  );
}
