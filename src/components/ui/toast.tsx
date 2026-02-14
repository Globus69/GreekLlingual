"use client";

import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    onClose: () => void;
}

export function Toast({ message, type = 'info', duration = 3000, onClose }: ToastProps) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Fade in
        requestAnimationFrame(() => {
            setIsVisible(true);
        });

        // Auto-close after duration
        const timer = setTimeout(() => {
            setIsVisible(false);
            setTimeout(onClose, 300); // Wait for fade out animation
        }, duration);

        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const getToastStyles = () => {
        switch (type) {
            case 'success':
                return {
                    background: 'rgba(52, 199, 89, 0.15)',
                    borderColor: 'rgba(52, 199, 89, 0.4)',
                    color: '#34C759',
                    emoji: '✅'
                };
            case 'error':
                return {
                    background: 'rgba(255, 69, 58, 0.15)',
                    borderColor: 'rgba(255, 69, 58, 0.4)',
                    color: '#FF453A',
                    emoji: '❌'
                };
            case 'warning':
                return {
                    background: 'rgba(255, 159, 10, 0.15)',
                    borderColor: 'rgba(255, 159, 10, 0.4)',
                    color: '#FF9F0A',
                    emoji: '⚠️'
                };
            case 'info':
            default:
                return {
                    background: 'rgba(0, 122, 255, 0.15)',
                    borderColor: 'rgba(0, 122, 255, 0.4)',
                    color: '#007AFF',
                    emoji: 'ℹ️'
                };
        }
    };

    const styles = getToastStyles();

    return (
        <div
            className={`toast-container ${isVisible ? 'visible' : ''}`}
            style={{
                '--toast-bg': styles.background,
                '--toast-border': styles.borderColor,
                '--toast-color': styles.color
            } as React.CSSProperties}
        >
            <span className="toast-emoji">{styles.emoji}</span>
            <span className="toast-message">{message}</span>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setTimeout(onClose, 300);
                }}
                className="toast-close"
                aria-label="Close"
            >
                ×
            </button>

            <style jsx>{`
                .toast-container {
                    position: fixed;
                    top: 24px;
                    right: 24px;
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    padding: 16px 20px;
                    border-radius: 12px;
                    background: var(--toast-bg);
                    border: 1px solid var(--toast-border);
                    color: var(--toast-color);
                    backdrop-filter: blur(12px);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    max-width: 400px;
                    opacity: 0;
                    transform: translateY(-20px);
                    transition: all 0.3s cubic-bezier(0.4, 0.0, 0.2, 1);
                    pointer-events: auto;
                }

                .toast-container.visible {
                    opacity: 1;
                    transform: translateY(0);
                }

                .toast-emoji {
                    font-size: 20px;
                    flex-shrink: 0;
                }

                .toast-message {
                    flex: 1;
                    font-size: 14px;
                    font-weight: 500;
                    line-height: 1.4;
                }

                .toast-close {
                    background: transparent;
                    border: none;
                    color: var(--toast-color);
                    font-size: 24px;
                    line-height: 1;
                    padding: 0;
                    cursor: pointer;
                    opacity: 0.6;
                    transition: opacity 0.2s;
                    flex-shrink: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .toast-close:hover {
                    opacity: 1;
                }

                /* Mobile Responsive */
                @media (max-width: 600px) {
                    .toast-container {
                        top: 16px;
                        right: 16px;
                        left: 16px;
                        max-width: none;
                    }

                    .toast-message {
                        font-size: 13px;
                    }
                }
            `}</style>
        </div>
    );
}

// Toast Manager Hook
export function useToast() {
    const [toasts, setToasts] = useState<Array<{
        id: string;
        message: string;
        type: ToastType;
        duration?: number;
    }>>([]);

    const showToast = (message: string, type: ToastType = 'info', duration?: number) => {
        const id = `toast-${Date.now()}-${Math.random()}`;
        setToasts(prev => [...prev, { id, message, type, duration }]);
    };

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    return {
        toasts,
        showToast,
        removeToast,
        success: (message: string, duration?: number) => showToast(message, 'success', duration),
        error: (message: string, duration?: number) => showToast(message, 'error', duration),
        warning: (message: string, duration?: number) => showToast(message, 'warning', duration),
        info: (message: string, duration?: number) => showToast(message, 'info', duration),
    };
}

// Toast Container Component
interface ToastContainerProps {
    toasts: Array<{
        id: string;
        message: string;
        type: ToastType;
        duration?: number;
    }>;
    onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
    return (
        <>
            {toasts.map((toast) => (
                <Toast
                    key={toast.id}
                    message={toast.message}
                    type={toast.type}
                    duration={toast.duration}
                    onClose={() => onRemove(toast.id)}
                />
            ))}
        </>
    );
}
