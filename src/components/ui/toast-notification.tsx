'use client';

import { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastNotificationProps {
    toasts: Toast[];
    onRemove: (id: string) => void;
}

export function ToastNotification({ toasts, onRemove }: ToastNotificationProps) {
    return (
        <div className="fixed top-4 right-4 z-[100] space-y-3 pointer-events-none">
            {toasts.map((toast) => (
                <ToastItem key={toast.id} toast={toast} onRemove={onRemove} />
            ))}
        </div>
    );
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => onRemove(toast.id), 300);
        }, 3000);

        return () => clearTimeout(timer);
    }, [toast.id, onRemove]);

    const styles = {
        success: {
            bg: 'bg-green-500/95',
            icon: '✅',
            border: 'border-green-400/30'
        },
        error: {
            bg: 'bg-red-500/95',
            icon: '❌',
            border: 'border-red-400/30'
        },
        warning: {
            bg: 'bg-orange-500/95',
            icon: '⚠️',
            border: 'border-orange-400/30'
        },
        info: {
            bg: 'bg-blue-500/95',
            icon: 'ℹ️',
            border: 'border-blue-400/30'
        }
    };

    const style = styles[toast.type];

    return (
        <div
            className={`pointer-events-auto ${style.bg} backdrop-blur-xl text-white px-6 py-4 rounded-2xl shadow-2xl border ${style.border} flex items-center gap-3 min-w-[300px] transition-all duration-300 ${isExiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'
                }`}
            style={{
                animation: isExiting ? 'slideOut 0.3s ease-out' : 'slideIn 0.3s ease-out'
            }}
        >
            <span className="text-2xl filter drop-shadow-lg">{style.icon}</span>
            <p className="flex-1 font-semibold text-sm">{toast.message}</p>
            <button
                onClick={() => {
                    setIsExiting(true);
                    setTimeout(() => onRemove(toast.id), 300);
                }}
                className="w-6 h-6 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-all duration-200 hover:scale-110"
            >
                <span className="text-white text-sm">×</span>
            </button>

            <style jsx>{`
                @keyframes slideIn {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                @keyframes slideOut {
                    from {
                        transform: translateX(0);
                        opacity: 1;
                    }
                    to {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                }
            `}</style>
        </div>
    );
}

// Hook for managing toasts
export function useToast() {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = (type: ToastType, message: string) => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { id, type, message }]);
    };

    const removeToast = (id: string) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    return {
        toasts,
        showToast,
        removeToast,
        success: (message: string) => showToast('success', message),
        error: (message: string) => showToast('error', message),
        warning: (message: string) => showToast('warning', message),
        info: (message: string) => showToast('info', message)
    };
}
