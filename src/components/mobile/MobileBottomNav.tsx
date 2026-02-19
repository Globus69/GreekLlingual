'use client';

import { memo, useCallback, useMemo, useState, CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/db/supabase';

// Stable tabs configuration (moved outside component to prevent recreation)
const TABS = [
  { href: '/m', icon: '🏠', label: 'Home', key: 'home' },
  { href: '/m/stats', icon: '📊', label: 'Stats', key: 'stats' },
  { href: '/m/extras', icon: '🔧', label: 'Extras', key: 'extras' },
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
  const router = useRouter();
  const { user } = useAuth();
  const [showAdminLoginDialog, setShowAdminLoginDialog] = useState(false);

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

  // Handle Extras button click
  const handleExtrasClick = useCallback(() => {
    if (user?.role === 'admin') {
      router.push('/m/extras');
    } else {
      setShowAdminLoginDialog(true);
    }
  }, [user?.role, router]);

  return (
    <>
      <nav style={NAV_STYLE}>
        <div style={CONTAINER_STYLE}>
          {TABS.map((tab, index) => {
            const active = activeStates[index].active;

            // Special handling for Extras tab
            if (tab.key === 'extras') {
              return (
                <button
                  key={tab.key}
                  onClick={handleExtrasClick}
                  data-testid={`mobile-nav-${tab.key}`}
                  style={{
                    ...getLinkStyle(active),
                    border: 'none',
                    background: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <span style={ICON_STYLE}>
                    {tab.icon}
                  </span>
                  <span style={getLabelStyle(active)}>
                    {tab.label}
                  </span>
                </button>
              );
            }

            // Regular Link for other tabs
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

      {/* Admin Login Dialog - OUTSIDE nav for proper z-index */}
      {showAdminLoginDialog && (
        <AdminLoginDialog
          onClose={() => setShowAdminLoginDialog(false)}
          onSuccess={() => {
            setShowAdminLoginDialog(false);
            router.push('/m/extras');
          }}
        />
      )}
    </>
  );
}

// Admin Login Dialog Component
interface AdminLoginDialogProps {
  onClose: () => void;
  onSuccess: () => void;
}

function AdminLoginDialog({ onClose, onSuccess }: AdminLoginDialogProps) {
  const [username, setUsername] = useState('Admin');
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // Use Supabase RPC to verify admin credentials
      const { data, error: rpcError } = await supabase
        .rpc('verify_user_pin', { p_name: username, p_pin: pin });

      if (rpcError || !data || data.length === 0) {
        setError('Invalid credentials');
        setLoading(false);
        return;
      }

      const dbUser = data[0];

      // Check if account is locked
      if (dbUser.error === 'Account locked. Try again later.') {
        setError('Account locked. Try again later.');
        setLoading(false);
        return;
      }

      // Check if invalid credentials
      if (dbUser.error) {
        setError('Invalid credentials');
        setLoading(false);
        return;
      }

      // Check if user is admin
      if (dbUser.user_role !== 'admin') {
        setError('Admin access required');
        setLoading(false);
        return;
      }

      // Success - update session
      const userData = {
        id: dbUser.user_id,
        email: dbUser.user_email,
        name: dbUser.user_name,
        role: dbUser.user_role as 'admin' | 'student',
        level: dbUser.user_level,
        difficulty: dbUser.user_difficulty,
        performance_index: dbUser.user_performance_index,
        preferred_locale: (dbUser.user_preferred_locale as 'en' | 'ru' | 'el' | 'de' | 'es') || 'en',
      };

      localStorage.setItem('greeklingua_user', JSON.stringify(userData));
      localStorage.setItem('greeklingua_session_ts', String(Date.now()));

      onSuccess();
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && username && pin.length === 6 && !loading) {
      handleLogin();
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: 'rgba(28, 28, 30, 0.98)',
          backdropFilter: 'blur(20px)',
          borderRadius: '16px',
          padding: '24px',
          maxWidth: '360px',
          width: '90%',
          maxHeight: '80vh',
          overflowY: 'auto',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔐</div>
          <h2 style={{ color: 'white', fontSize: '22px', fontWeight: 'bold', marginBottom: '8px', margin: 0 }}>
            Admin Login
          </h2>
          <p style={{ color: '#8E8E93', fontSize: '14px', margin: 0 }}>
            Enter admin credentials to access Extras
          </p>
        </div>

        {/* Username Input */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ display: 'block', color: '#8E8E93', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
            Username
          </label>
          <input
            type="text"
            placeholder="Admin username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={true}
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '10px',
              color: 'rgba(255, 255, 255, 0.7)',
              fontSize: '16px',
              outline: 'none',
              boxSizing: 'border-box',
              cursor: 'not-allowed',
              opacity: 0.7,
            }}
          />
        </div>

        {/* PIN Input */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', color: '#8E8E93', fontSize: '13px', fontWeight: '500', marginBottom: '6px' }}>
            PIN
          </label>
          <input
            type="password"
            placeholder="6-digit PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            onKeyPress={handleKeyPress}
            maxLength={6}
            inputMode="numeric"
            autoFocus={true}
            style={{
              width: '100%',
              padding: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '18px',
              outline: 'none',
              boxSizing: 'border-box',
              letterSpacing: '6px',
              textAlign: 'center',
            }}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div
            style={{
              padding: '12px',
              marginBottom: '16px',
              backgroundColor: 'rgba(255, 59, 48, 0.15)',
              border: '1px solid rgba(255, 59, 48, 0.3)',
              borderRadius: '10px',
            }}
          >
            <div style={{ color: '#FF3B30', fontSize: '13px', textAlign: 'center' }}>
              ⚠️ {error}
            </div>
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              borderRadius: '10px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleLogin}
            disabled={loading || !username || pin.length !== 6}
            style={{
              flex: 1,
              padding: '14px',
              backgroundColor: (loading || !username || pin.length !== 6) ? 'rgba(0, 122, 255, 0.5)' : '#007AFF',
              border: 'none',
              borderRadius: '10px',
              color: 'white',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (loading || !username || pin.length !== 6) ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Wrap component in React.memo to prevent unnecessary re-renders
export default memo(MobileBottomNav);
