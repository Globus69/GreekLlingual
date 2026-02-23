'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { APP_VERSION } from '@/lib/appVersion';
import DashboardHeader from '@/components/dashboard/DashboardHeader';

export default function SettingsPage() {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    if (confirm('Are you sure you want to logout?')) {
      await logout();
      router.push('/login-pin');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#0F0F11' }}>
      {/* Dashboard Header */}
      <DashboardHeader />

      <div style={{ padding: '24px 32px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Page Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              borderRadius: '12px',
              fontSize: '20px',
              color: 'white',
              cursor: 'pointer',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            ←
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', margin: 0, marginBottom: '6px' }}>
              ⚙️ Settings
            </h1>
            <p style={{ fontSize: '16px', color: '#93C5FD', margin: 0 }}>
              Manage your account and preferences
            </p>
          </div>
        </div>

        {/* Two-Column Layout for Desktop */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(450px, 1fr))',
          gap: '24px',
          marginBottom: '32px',
        }}>
          {/* User Info Card */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            }}
          >
            <div style={{ fontSize: '14px', color: '#8E8E93', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
              Account
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
              {user?.name || 'Student'}
            </div>
            <div style={{ fontSize: '16px', color: '#8E8E93', marginBottom: '12px' }}>
              {user?.email || 'No email'}
            </div>
            <div style={{ fontSize: '16px', color: '#8E8E93' }}>
              Level: <span style={{ color: '#FFD60A', fontWeight: 'bold', fontSize: '18px' }}>{user?.level || 'A1'}</span>
            </div>
          </div>

          {/* App Info Card */}
          <div
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              padding: '28px',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
            }}
          >
            <div style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
              GreekLingua Dashboard
            </div>
            <div style={{ fontSize: '16px', color: '#8E8E93', marginBottom: '4px' }}>
              {APP_VERSION}
            </div>
            <div style={{ fontSize: '14px', color: '#8E8E93' }}>
              Made with ❤️ for Greek language learners
            </div>
          </div>
        </div>

        {/* Settings Options */}
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(10px)',
          borderRadius: '16px',
          padding: '28px',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          marginBottom: '24px',
        }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: 'white', marginBottom: '20px', marginTop: 0 }}>
            Preferences
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '12px',
          }}>
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
            <SettingButton
              icon="📱"
              title="Mobile App"
              subtitle="View mobile version"
              onClick={() => router.push('/m/settings')}
            />
          </div>
        </div>

        {/* Danger Zone */}
        <div
          style={{
            backgroundColor: 'rgba(255, 59, 48, 0.15)',
            backdropFilter: 'blur(10px)',
            borderRadius: '16px',
            padding: '28px',
            border: '1px solid rgba(255, 59, 48, 0.3)',
            maxWidth: '500px',
          }}
        >
          <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#FF3B30', marginBottom: '12px', marginTop: 0 }}>
            Danger Zone
          </h3>
          <p style={{ fontSize: '14px', color: '#8E8E93', marginBottom: '16px' }}>
            This action will log you out of your account. You'll need to login again to access your data.
          </p>
          <button
            onClick={handleLogout}
            style={{
              padding: '14px 24px',
              backgroundColor: 'rgba(255, 59, 48, 0.2)',
              border: '1px solid rgba(255, 59, 48, 0.4)',
              borderRadius: '12px',
              color: '#FF3B30',
              fontSize: '16px',
              fontWeight: 'bold',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 59, 48, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(255, 59, 48, 0.4)';
            }}
          >
            🚪 Logout
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
        padding: '16px',
        backgroundColor: 'rgba(255, 255, 255, 0.05)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        gap: '14px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      <span style={{ fontSize: '32px' }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '16px', fontWeight: 'bold', color: 'white', marginBottom: '3px' }}>
          {title}
        </div>
        <div style={{ fontSize: '13px', color: '#8E8E93' }}>
          {subtitle}
        </div>
      </div>
      <span style={{ fontSize: '18px', color: '#8E8E93' }}>→</span>
    </button>
  );
}
