/**
 * SessionTimerDisplay Component
 *
 * Displays real-time session duration in learning dialogs.
 * Shows elapsed time with a clean, minimal design.
 *
 * Usage:
 * <SessionTimerDisplay duration={sessionDuration} isActive={isSessionActive} />
 */

"use client";

import React from 'react';
import { formatSessionDuration } from '@/hooks/use-session-time';

interface SessionTimerDisplayProps {
  duration: number; // in seconds
  isActive: boolean;
  className?: string;
}

export default function SessionTimerDisplay({
  duration,
  isActive,
  className = '',
}: SessionTimerDisplayProps) {
  if (!isActive || duration === 0) {
    return null;
  }

  return (
    <div className={`session-timer-display ${className}`}>
      <span className="timer-icon">⏱️</span>
      <span className="timer-text">{formatSessionDuration(duration)}</span>
      <style jsx>{`
        .session-timer-display {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 500;
          color: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .timer-icon {
          font-size: 1rem;
          line-height: 1;
        }

        .timer-text {
          font-variant-numeric: tabular-nums;
          letter-spacing: 0.5px;
        }

        @media (max-width: 768px) {
          .session-timer-display {
            font-size: 0.8rem;
            padding: 4px 10px;
          }

          .timer-icon {
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
}
