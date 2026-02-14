'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/db/supabase';

interface User {
  id: string;
  name: string;
  email: string;
  locked_until: string | null;
  failed_attempts: number;
}

export default function MobileAdminUnlockPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [unlockingUserId, setUnlockingUserId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ show: boolean; message: string; success: boolean }>({
    show: false,
    message: '',
    success: false,
  });

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login-pin');
      return;
    }

    // Check if user is admin
    if (user?.role !== 'teacher' && user?.role !== 'admin') {
      router.push('/m');
      return;
    }

    loadUsers();
  }, [isAuthenticated, user]);

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, name, email, locked_until, failed_attempts')
        .order('name');

      if (error) throw error;

      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Fehler beim Laden der Benutzer', false);
    } finally {
      setLoading(false);
    }
  };

  const handleUnlock = async (userId: string) => {
    setUnlockingUserId(userId);

    try {
      const { data, error } = await supabase.rpc('unlock_user', {
        p_user_id: userId,
      });

      if (error) throw error;

      const result = data[0];
      if (result.success) {
        showToast(`${result.user_name} wurde entsperrt`, true);
        // Reload users
        await loadUsers();
      } else {
        showToast(result.message, false);
      }
    } catch (error) {
      console.error('Error unlocking user:', error);
      showToast('Fehler beim Entsperren', false);
    } finally {
      setUnlockingUserId(null);
    }
  };

  const showToast = (message: string, success: boolean) => {
    setToast({ show: true, message, success });
    setTimeout(() => {
      setToast({ show: false, message: '', success: false });
    }, 3000);
  };

  const isLocked = (lockedUntil: string | null) => {
    if (!lockedUntil) return false;
    return new Date(lockedUntil) > new Date();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-lg">Loading...</div>
      </div>
    );
  }

  const lockedUsers = users.filter((u) => isLocked(u.locked_until));
  const activeUsers = users.filter((u) => !isLocked(u.locked_until));

  return (
    <div className="min-h-screen p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 py-4">
        <button
          onClick={() => router.push('/m')}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all"
        >
          <span className="text-2xl">←</span>
        </button>
        <div>
          <h1 className="text-3xl font-bold text-white">
            🔓 User Unlock
          </h1>
          <p className="text-blue-200 text-sm">Admin Panel</p>
        </div>
      </div>

      {/* Locked Users Section */}
      {lockedUsers.length > 0 && (
        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <span>🔒</span>
            Gesperrte Benutzer ({lockedUsers.length})
          </h2>

          <div className="space-y-3">
            {lockedUsers.map((u) => (
              <div
                key={u.id}
                className="bg-red-500/10 border border-red-500/30 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="text-white font-semibold">{u.name}</div>
                    <div className="text-red-300 text-sm">{u.email}</div>
                    <div className="text-red-200 text-xs mt-1">
                      Fehlversuche: {u.failed_attempts || 0}
                    </div>
                  </div>
                  <button
                    onClick={() => handleUnlock(u.id)}
                    disabled={unlockingUserId === u.id}
                    className="px-4 py-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed min-w-[100px]"
                  >
                    {unlockingUserId === u.id ? '...' : 'Unlock'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Active Users Section */}
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <span>✅</span>
          Aktive Benutzer ({activeUsers.length})
        </h2>

        <div className="space-y-2">
          {activeUsers.map((u) => (
            <div
              key={u.id}
              className="bg-white/5 rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-white font-semibold">{u.name}</div>
                  <div className="text-blue-200 text-sm">{u.email}</div>
                </div>
                <div className="text-green-400 text-2xl">✓</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* No locked users message */}
      {lockedUsers.length === 0 && (
        <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-6 text-center">
          <div className="text-4xl mb-2">✨</div>
          <div className="text-green-300 font-semibold">
            Alle Benutzer sind aktiv!
          </div>
          <div className="text-green-200 text-sm mt-1">
            Keine gesperrten Accounts
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toast.show && (
        <div
          className={`fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-2xl shadow-lg backdrop-blur-md ${toast.success
              ? 'bg-green-500/90 text-white'
              : 'bg-red-500/90 text-white'
            }`}
          style={{ animation: 'slideUp 0.3s ease-out' }}
        >
          <div className="font-semibold flex items-center gap-2">
            <span>{toast.success ? '✅' : '❌'}</span>
            {toast.message}
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
    </div>
  );
}
