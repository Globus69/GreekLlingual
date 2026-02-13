'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/useTranslation';

export default function MobileSettingsPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const { locale, setLocale } = useLanguage();
  const router = useRouter();
  const { t } = useTranslation();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login-pin');
    }
  }, [isAuthenticated]);

  const handleLogout = () => {
    logout();
    router.push('/login-pin');
  };

  const languages = [
    { code: 'en', flag: '🇬🇧', name: 'English' },
    { code: 'ru', flag: '🇷🇺', name: 'Русский' },
    { code: 'el', flag: '🇬🇷', name: 'Ελληνικά' },
    { code: 'de', flag: '🇩🇪', name: 'Deutsch' },
  ];

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="text-center py-6">
        <h1 className="text-3xl font-bold text-white mb-2">
          ⚙️ {t('header.settings') || 'Settings'}
        </h1>
        <p className="text-blue-200">{user?.name || 'Student'}</p>
      </div>

      {/* User Info Section */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-white mb-4">Account</h2>

        <div className="space-y-3">
          <InfoRow label="Name" value={user?.name || '-'} />
          <InfoRow label="Email" value={user?.email || '-'} />
          <InfoRow label="Level" value={user?.level || 'A1'} />
          <InfoRow label="Difficulty" value={user?.difficulty || 'easy'} />
        </div>
      </div>

      {/* Language Section */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          🌐 {t('settings.language') || 'Language'}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLocale(lang.code as any)}
              className={`
                p-4 rounded-xl
                flex flex-col items-center justify-center
                transition-all duration-200
                ${
                  locale === lang.code
                    ? 'bg-blue-500 shadow-lg shadow-blue-500/50'
                    : 'bg-white/5 hover:bg-white/10'
                }
              `}
            >
              <span className="text-4xl mb-2">{lang.flag}</span>
              <span
                className={`text-sm font-medium ${
                  locale === lang.code ? 'text-white' : 'text-blue-200'
                }`}
              >
                {lang.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Appearance Section */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          🎨 Appearance
        </h2>

        <div className="space-y-3">
          <button
            onClick={() => router.push('/dashboard')}
            className="w-full p-4 rounded-xl bg-white/5 hover:bg-white/10 text-left transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💻</span>
                <span className="text-white font-medium">
                  Switch to Desktop Version
                </span>
              </div>
              <span className="text-blue-300">→</span>
            </div>
          </button>
        </div>
      </div>

      {/* Biometric Auth (Phase 2) */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 opacity-50">
        <h2 className="text-xl font-bold text-white mb-4">
          🔒 Security
        </h2>

        <div className="space-y-3">
          <div className="p-4 rounded-xl bg-white/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">📱</span>
                <span className="text-white font-medium">
                  Biometric Login (Face ID/Touch ID)
                </span>
              </div>
              <span className="text-xs text-blue-300 bg-blue-500/20 px-2 py-1 rounded">
                Coming Soon
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Section */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full p-4 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold transition-all"
        >
          🚪 {t('header.logout') || 'Logout'}
        </button>
      </div>

      {/* App Info */}
      <div className="text-center py-4 space-y-2 text-blue-200/50 text-sm">
        <p>HellenicHorizons GreekLingua</p>
        <p>Mobile App v1.0.0</p>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-bold text-white mb-4">
              Confirm Logout
            </h3>
            <p className="text-blue-200 mb-6">
              Are you sure you want to log out?
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 p-3 rounded-xl bg-white/10 text-white font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 p-3 rounded-xl bg-red-500 text-white font-semibold"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-white/10">
      <span className="text-blue-200">{label}</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}
