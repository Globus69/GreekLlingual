"use client";

import React, { useState, useEffect } from 'react';

/**
 * TrainWeakWordsSheet
 *
 * Mobile-optimiertes Bottom Sheet für das "Train Weak Words" Modul
 * - Touch-optimierte Buttons (min 56px)
 * - Dark Design mit Glassmorphism
 * - Swipe-to-close (optional)
 */

interface TrainWeakWordsSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TrainWeakWordsSheet({ isOpen, onClose }: TrainWeakWordsSheetProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Delay für Slide-in Animation
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
                backgroundColor: 'rgba(255, 159, 10, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
              }}
            >
              💪
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'white', margin: 0 }}>
                Train Weak Words
              </h2>
              <p style={{ fontSize: '13px', color: '#8E8E93', margin: '2px 0 0 0' }}>
                Focus on difficult words
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
          {/* Stats Card */}
          <div
            style={{
              backgroundColor: 'rgba(255, 159, 10, 0.15)',
              border: '1px solid rgba(255, 159, 10, 0.3)',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'white', margin: 0 }}>
                Weak Words to Review
              </h3>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={{ fontSize: '14px', color: '#A8A8AD' }}>Total weak words:</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: '#FF9F0A' }}>12</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '14px', color: '#A8A8AD' }}>Success rate:</span>
              <span style={{ fontSize: '16px', fontWeight: 'bold', color: 'white' }}>45%</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <button
              onClick={() => alert('Starting training session...')}
              style={{
                width: '100%',
                minHeight: '56px',
                padding: '16px',
                borderRadius: '16px',
                backgroundColor: '#FF9F0A',
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
              <span style={{ fontSize: '20px' }}>📈</span>
              Start Training Session
            </button>

            <button
              onClick={() => alert('Viewing word list...')}
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
              }}
            >
              View Word List
            </button>
          </div>

          {/* Info */}
          <div
            style={{
              marginTop: '24px',
              padding: '16px',
              backgroundColor: 'rgba(0, 122, 255, 0.1)',
              borderRadius: '12px',
              border: '1px solid rgba(0, 122, 255, 0.2)',
            }}
          >
            <p style={{ fontSize: '13px', color: '#A8A8AD', margin: 0, lineHeight: '1.5' }}>
              💡 <strong style={{ color: 'white' }}>Tip:</strong> Focus on words you've gotten wrong 3+ times for best results.
            </p>
          </div>
        </div>

        {/* Bottom Padding for safe area */}
        <div style={{ height: '24px' }} />
      </div>
    </>
  );
}
