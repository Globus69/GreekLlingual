'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/db/supabase';
import { getPracticeConfig } from '@/lib/supabase/content';
import { PracticeModesSheet } from '@/components/mobile/PracticeModesSheet';
import type { PracticeMode } from '@/lib/validation/schemas';

interface PracticeItem {
  id: string;
  english: string;
  greek: string;
  level?: string;
  difficulty?: string;
  practice_modes_config: {
    enabled: boolean;
    available_modes: PracticeMode[];
    activation_threshold: number;
  };
}

interface UnlockStatus {
  [modeType: string]: {
    unlocked: boolean;
    user_reps: number;
    threshold: number;
  };
}

export default function MobilePracticeModesPage() {
  const { user, isAuthenticated } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [practiceItems, setPracticeItems] = useState<PracticeItem[]>([]);
  const [unlockStatuses, setUnlockStatuses] = useState<Record<string, UnlockStatus>>({});
  const [selectedItem, setSelectedItem] = useState<PracticeItem | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.push('/login-pin');
    }
  }, [mounted, isAuthenticated, router]);

  /**
   * Load learning items with practice modes enabled
   */
  const loadPracticeItems = useCallback(async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      console.log('🎮 [Mobile Practice] Loading practice items');

      const { data: items, error } = await supabase
        .rpc('get_practice_enabled_items');

      if (error) {
        console.error('Error loading practice items:', error);
        return;
      }

      // Filter enabled items
      const enabledItems = (items || []).filter(
        (item: any) => {
          const hasConfig = !!item.practice_modes_config;
          const isEnabled = item.practice_modes_config?.enabled === true;
          const hasModes = (item.practice_modes_config?.available_modes?.length || 0) > 0;
          return hasConfig && isEnabled && hasModes;
        }
      );

      console.log('🎮 [Mobile Practice] Enabled items:', enabledItems.length);
      setPracticeItems(enabledItems);

      // Load unlock statuses
      await loadUnlockStatuses(enabledItems);
    } catch (err) {
      console.error('Error loading practice items:', err);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  /**
   * Load unlock status for all items and modes
   */
  const loadUnlockStatuses = async (items: PracticeItem[]) => {
    if (!user?.id) return;

    const statuses: Record<string, UnlockStatus> = {};

    for (const item of items) {
      const itemStatuses: UnlockStatus = {};

      for (const mode of item.practice_modes_config.available_modes) {
        try {
          const config = await getPracticeConfig(item.id, user.id, mode);

          if (config) {
            itemStatuses[mode] = {
              unlocked: config.unlocked,
              user_reps: config.user_reps,
              threshold: config.threshold,
            };
          }
        } catch (err) {
          console.error(`Error checking unlock for ${item.id}/${mode}:`, err);
        }
      }

      statuses[item.id] = itemStatuses;
    }

    setUnlockStatuses(statuses);
  };

  useEffect(() => {
    if (user?.id) {
      loadPracticeItems();
    }
  }, [user?.id, loadPracticeItems]);

  /**
   * Handle item card click - open mode selection sheet
   */
  const handleItemClick = (item: PracticeItem) => {
    setSelectedItem(item);
    setSheetOpen(true);
  };

  /**
   * Handle sheet close
   */
  const handleSheetClose = () => {
    setSheetOpen(false);
    setSelectedItem(null);
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0F0F11',
      }}>
        <div style={{ color: 'white', fontSize: '18px' }}>Loading practice modes...</div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0F0F11',
      paddingBottom: '80px'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        padding: '24px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: 'rgba(28, 28, 30, 0.95)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}>
        <button
          onClick={() => router.push('/m')}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '24px',
            color: 'white',
            cursor: 'pointer',
            padding: 0,
            minWidth: '44px',
            minHeight: '44px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: 'white',
            margin: 0,
            marginBottom: '4px'
          }}>
            🎮 Practice Modes
          </h1>
          <p style={{
            fontSize: '14px',
            color: '#93C5FD',
            margin: 0
          }}>
            {user?.name || 'Student'}
          </p>
        </div>
      </div>

      {/* Practice Items List */}
      <div style={{ padding: '16px' }}>
        {practiceItems.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '48px 24px',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>🎮</div>
            <h3 style={{
              fontSize: '18px',
              fontWeight: '600',
              color: 'white',
              marginBottom: '8px'
            }}>
              No Practice Modes Available
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#8E8E93',
              margin: 0
            }}>
              Practice modes will appear here once content is available.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            {practiceItems.map(item => {
              const itemUnlockStatuses = unlockStatuses[item.id] || {};
              const anyUnlocked = Object.values(itemUnlockStatuses).some(s => s.unlocked);
              const allUnlocked = item.practice_modes_config.available_modes.every(
                mode => itemUnlockStatuses[mode]?.unlocked
              );

              return (
                <PracticeItemCard
                  key={item.id}
                  item={item}
                  anyUnlocked={anyUnlocked}
                  allUnlocked={allUnlocked}
                  unlockStatuses={itemUnlockStatuses}
                  onClick={() => handleItemClick(item)}
                />
              );
            })}
          </div>
        )}
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
        <div style={{
          maxWidth: '448px',
          margin: '0 auto',
          display: 'flex',
          justifyContent: 'space-around'
        }}>
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
              minWidth: '60px',
              minHeight: '60px',
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
              minWidth: '60px',
              minHeight: '60px',
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
              minWidth: '60px',
              minHeight: '60px',
            }}
          >
            <span style={{ fontSize: '24px' }}>⚙️</span>
            <span style={{ fontSize: '11px', fontWeight: '500', color: '#8E8E93' }}>Settings</span>
          </button>
        </div>
      </div>

      {/* Mode Selection Bottom Sheet */}
      {selectedItem && (
        <PracticeModesSheet
          isOpen={sheetOpen}
          onClose={handleSheetClose}
          item={selectedItem}
          unlockStatuses={unlockStatuses[selectedItem.id] || {}}
        />
      )}
    </div>
  );
}

/**
 * Practice Item Card Component
 */
function PracticeItemCard({
  item,
  anyUnlocked,
  allUnlocked,
  unlockStatuses,
  onClick,
}: {
  item: PracticeItem;
  anyUnlocked: boolean;
  allUnlocked: boolean;
  unlockStatuses: UnlockStatus;
  onClick: () => void;
}) {
  const getStatusIcon = () => {
    if (allUnlocked) return '✅';
    if (anyUnlocked) return '🔓';
    return '🔒';
  };

  const getStatusText = () => {
    if (allUnlocked) return 'All Modes Unlocked';
    if (anyUnlocked) return 'Some Modes Available';

    // Get min threshold to unlock first mode
    const thresholds = Object.values(unlockStatuses).map(s => s.threshold - s.user_reps);
    const minThreshold = Math.min(...thresholds);
    return `${minThreshold} reviews to unlock`;
  };

  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        minHeight: '88px',
        padding: '16px',
        backgroundColor: anyUnlocked ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.05)',
        backdropFilter: 'blur(10px)',
        border: `1px solid ${anyUnlocked ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)'}`,
        borderRadius: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        textAlign: 'left',
        opacity: anyUnlocked ? 1 : 0.7,
      }}
    >
      {/* Icon */}
      <div style={{
        width: '56px',
        height: '56px',
        minWidth: '56px',
        borderRadius: '12px',
        backgroundColor: anyUnlocked ? 'rgba(0, 122, 255, 0.2)' : 'rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '28px',
      }}>
        {getStatusIcon()}
      </div>

      {/* Content */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '600',
          color: 'white',
          margin: 0,
          marginBottom: '4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {item.english}
        </h3>
        <p style={{
          fontSize: '14px',
          color: '#93C5FD',
          margin: 0,
          marginBottom: '6px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {item.greek}
        </p>
        <div style={{
          fontSize: '12px',
          color: anyUnlocked ? '#34C759' : '#8E8E93',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
        }}>
          <span>{getStatusText()}</span>
          {item.level && (
            <>
              <span>•</span>
              <span>{item.level}</span>
            </>
          )}
        </div>
      </div>

      {/* Arrow */}
      <div style={{
        fontSize: '20px',
        color: '#8E8E93',
      }}>
        →
      </div>
    </button>
  );
}
