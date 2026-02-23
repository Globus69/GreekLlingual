// lib/monitor.ts - Frontend Error Monitoring
// Sends critical errors to /api/monitor → Telegram
// Only fires for truly unexpected, user-impacting errors

type MonitorType = 'error' | 'warning' | 'info' | 'security';

interface MonitorOptions {
    type?: MonitorType;
    details?: Record<string, any>;
    userId?: string;
    page?: string;
}

// Deduplicate: same message won't be sent twice within 5 minutes
const sentMessages = new Map<string, number>();
const DEDUP_WINDOW = 5 * 60 * 1000;

export async function reportError(message: string, options: MonitorOptions = {}) {
    // Only in production – avoid spamming during development
    if (process.env.NODE_ENV !== 'production') {
        console.warn(`[Monitor] ${options.type || 'error'}: ${message}`, options);
        return;
    }

    // Deduplication check
    const key = `${message}-${options.page || ''}`;
    const lastSent = sentMessages.get(key);
    if (lastSent && Date.now() - lastSent < DEDUP_WINDOW) {
        return; // Already reported recently
    }
    sentMessages.set(key, Date.now());

    try {
        await fetch('/api/monitor', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: options.type || 'error',
                message,
                details: options.details,
                userId: options.userId,
                page: options.page || (typeof window !== 'undefined' ? window.location.pathname : undefined),
            }),
            // Non-blocking: don't await in critical paths, just fire-and-forget
            keepalive: true,
        });
    } catch {
        // Never throw from a monitoring function
    }
}

// Convenience shortcuts
export const reportWarning = (msg: string, opts?: MonitorOptions) => reportError(msg, { ...opts, type: 'warning' });
export const reportSecurity = (msg: string, opts?: MonitorOptions) => reportError(msg, { ...opts, type: 'security' });
