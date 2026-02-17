"use client";

import React, { useState, useEffect } from 'react';
import { PracticeModeDialog } from '@/components/learning/practice-modes/practice-mode-dialog';
import type { PracticeMode } from '@/lib/validation/schemas';

interface UnlockStatus {
  [modeType: string]: {
    unlocked: boolean;
    user_reps: number;
    threshold: number;
  };
}

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

interface PracticeModesSheetProps {
  isOpen: boolean;
  onClose: () => void;
  item: PracticeItem;
  unlockStatuses: UnlockStatus;
}

export function PracticeModesSheet({
  isOpen,
  onClose,
  item,
  unlockStatuses,
}: PracticeModesSheetProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedMode, setSelectedMode] = useState<PracticeMode | null>(null);
  const [modeDialogOpen, setModeDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  /**
   * Get mode icon
   */
  const getModeIcon = (mode: PracticeMode): string => {
    switch (mode) {
      case 'matching':
        return '🎮';
      case 'multiple_choice':
        return '🎯';
      case 'write_input':
        return '✍️';
      default:
        return '🎮';
    }
  };

  /**
   * Get mode title
   */
  const getModeTitle = (mode: PracticeMode): string => {
    switch (mode) {
      case 'matching':
        return 'Matching Game';
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'write_input':
        return 'Write It Out';
      default:
        return mode;
    }
  };

  /**
   * Get mode description
   */
  const getModeDescription = (mode: PracticeMode): string => {
    switch (mode) {
      case 'matching':
        return 'Match Greek words with their English translations';
      case 'multiple_choice':
        return 'Choose the correct translation from 4 options';
      case 'write_input':
        return 'Type the Greek word or phrase from memory';
      default:
        return '';
    }
  };

  /**
   * Handle mode button click
   */
  const handleModeClick = (mode: PracticeMode) => {
    const status = unlockStatuses[mode];

    if (!status || !status.unlocked) {
      // Mode is locked - show feedback
      return;
    }

    // Open practice mode dialog
    setSelectedMode(mode);
    setModeDialogOpen(true);
  };

  /**
   * Handle mode dialog close
   */
  const handleModeDialogClose = () => {
    setModeDialogOpen(false);
    setSelectedMode(null);
    // Also close the sheet
    onClose();
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 999,
          backgroundColor: 'rgba(0, 0, 0, 0.6)',
          backdropFilter: 'blur(4px)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Bottom Sheet */}
      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          backgroundColor: 'rgba(28, 28, 30, 0.98)',
          backdropFilter: 'blur(30px)',
          borderTopLeftRadius: '24px',
          borderTopRightRadius: '24px',
          maxHeight: '85vh',
          overflowY: 'auto',
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
          boxShadow: '0 -8px 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Handle Bar */}
        <div style={{ padding: '12px', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: '40px',
              height: '4px',
              backgroundColor: 'rgba(255, 255, 255, 0.3)',
              borderRadius: '2px',
            }}
          />
        </div>

        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 24px',
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 'bold',
              color: 'white',
              margin: 0,
              marginBottom: '4px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.english}
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#93C5FD',
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}>
              {item.greek}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              minWidth: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              marginLeft: '12px',
            }}
          >
            <span style={{ fontSize: '18px', color: 'white' }}>✕</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          <h3 style={{
            fontSize: '16px',
            fontWeight: '600',
            color: 'white',
            marginBottom: '16px',
            marginTop: 0,
          }}>
            Choose a Practice Mode
          </h3>

          {/* Mode Buttons */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}>
            {item.practice_modes_config.available_modes.map(mode => {
              const status = unlockStatuses[mode];
              const isUnlocked = status?.unlocked || false;
              const remaining = status ? status.threshold - status.user_reps : 0;

              return (
                <button
                  key={mode}
                  onClick={() => handleModeClick(mode)}
                  disabled={!isUnlocked}
                  style={{
                    width: '100%',
                    minHeight: '80px',
                    padding: '16px',
                    backgroundColor: isUnlocked
                      ? 'rgba(0, 122, 255, 0.15)'
                      : 'rgba(255, 255, 255, 0.05)',
                    border: `1px solid ${
                      isUnlocked
                        ? 'rgba(0, 122, 255, 0.3)'
                        : 'rgba(255, 255, 255, 0.1)'
                    }`,
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    cursor: isUnlocked ? 'pointer' : 'not-allowed',
                    opacity: isUnlocked ? 1 : 0.6,
                    transition: 'all 0.2s ease',
                    textAlign: 'left',
                  }}
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: '56px',
                      height: '56px',
                      minWidth: '56px',
                      borderRadius: '12px',
                      backgroundColor: isUnlocked
                        ? 'rgba(0, 122, 255, 0.2)'
                        : 'rgba(255, 255, 255, 0.1)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '28px',
                    }}
                  >
                    {isUnlocked ? getModeIcon(mode) : '🔒'}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4
                      style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: 'white',
                        margin: 0,
                        marginBottom: '4px',
                      }}
                    >
                      {getModeTitle(mode)}
                    </h4>
                    <p
                      style={{
                        fontSize: '13px',
                        color: isUnlocked ? '#93C5FD' : '#8E8E93',
                        margin: 0,
                        lineHeight: '1.4',
                      }}
                    >
                      {isUnlocked
                        ? getModeDescription(mode)
                        : `Complete ${remaining} more review${remaining > 1 ? 's' : ''} to unlock`}
                    </p>
                  </div>

                  {/* Arrow (only if unlocked) */}
                  {isUnlocked && (
                    <div style={{ fontSize: '20px', color: '#007AFF' }}>→</div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Info Box */}
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: 'rgba(0, 122, 255, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 122, 255, 0.2)',
            }}
          >
            <p
              style={{
                fontSize: '13px',
                color: '#93C5FD',
                margin: 0,
                lineHeight: '1.5',
              }}
            >
              💡 <strong style={{ color: 'white' }}>Tip:</strong> Complete regular reviews to
              unlock more practice modes. Each mode offers a unique way to master vocabulary!
            </p>
          </div>
        </div>

        {/* Bottom Padding */}
        <div style={{ height: '24px' }} />
      </div>

      {/* Practice Mode Dialog (Desktop Component Reused) */}
      {selectedMode && (
        <PracticeModeDialog
          isOpen={modeDialogOpen}
          onClose={handleModeDialogClose}
          itemId={item.id}
          modeType={selectedMode}
        />
      )}
    </>
  );
}
