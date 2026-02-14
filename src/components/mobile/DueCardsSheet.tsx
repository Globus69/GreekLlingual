"use client";

import React, { useState, useEffect } from 'react';

/**
 * DueCardsSheet
 *
 * Mobile-optimiertes Bottom Sheet für das "Due Cards Today" Modul
 * - Touch-optimierte Buttons (min 56px)
 * - Dark Design mit Glassmorphism
 * - Swipe-to-close (optional)
 */

interface DueCardsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  dueCount?: number;
}

export function DueCardsSheet({ isOpen, onClose, dueCount = 0 }: DueCardsSheetProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                backgroundColor: 'rgba(0, 122, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              📅
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Due Cards Today
              </h2>
              <p style={{ fontSize: '13px', color: '#8E8E93', margin: '2px 0 0 0' }}>
                {dueCount} cards waiting for review
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontSize: '18px', color: 'white' }}>✕</span>
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {dueCount === 0 ? (
            // Empty State
            <div
              style={{
                textAlign: 'center',
                padding: '48px 24px',
              }}
            >
              <div style={{ fontSize: '64px', marginBottom: '16px' }}>✨</div>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'white', marginBottom: '8px' }}>
                All caught up!
              </h3>
              <p style={{ fontSize: '14px', color: '#8E8E93', margin: 0 }}>
                No cards are due for review today. Check back tomorrow!
              </p>
            </div>
          ) : (
            <>
              {/* Stats Card */}
              <div
                style={{
                  backgroundColor: 'rgba(0, 122, 255, 0.15)',
                  border: '1px solid rgba(0, 122, 255, 0.3)',
                  borderRadius: '16px',
                  padding: '20px',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <span style={{ fontSize: '24px' }}>📆</span>
                  <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: 0 }}>
                    Today's Review Session
                  </h3>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#A8A8AD' }}>Cards due:</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#007AFF' }}>{dueCount}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '14px', color: '#A8A8AD' }}>Estimated time:</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>{Math.ceil(dueCount * 0.5)} min</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '14px', color: '#A8A8AD' }}>Cards reviewed today:</span>
                  <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#34C759' }}>0</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <button
                  onClick={() => alert('Starting review session...')}
                  style={{
                    width: '100%',
                    minHeight: '56px',
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: '#007AFF',
                    border: 'none',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>✓</span>
                  Start Review Session
                </button>

                <button
                  onClick={() => alert('Quick review (5 cards)...')}
                  style={{
                    width: '100%',
                    minHeight: '56px',
                    padding: '16px',
                    borderRadius: '16px',
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    color: 'white',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                  }}
                >
                  <span style={{ fontSize: '20px' }}>⏱️</span>
                  Quick Review (5 cards)
                </button>
              </div>

              {/* Info */}
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px',
                  backgroundColor: 'rgba(52, 199, 89, 0.1)',
                  borderRadius: '12px',
                  border: '1px solid rgba(52, 199, 89, 0.2)',
                }}
              >
                <p style={{ fontSize: '13px', color: '#A8A8AD', margin: 0, lineHeight: '1.5' }}>
                  💡 <strong style={{ color: 'white' }}>Tip:</strong> Reviewing cards daily improves long-term retention by up to 80%!
                </p>
              </div>
            </>
          )}
        </div>

        {/* Bottom Padding for safe area */}
        <div style={{ height: '24px' }} />
      </div>
    </>
  );
}
