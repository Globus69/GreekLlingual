"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';

interface LoginLogEntry {
    id: string;
    username: string;
    ip_address: string | null;
    success: boolean;
    error_message: string | null;
    created_at: string;
}

interface LoginStats {
    total_attempts: number;
    successful_logins: number;
    failed_logins: number;
    unique_ips: number;
    last_24h_attempts: number;
    last_24h_failed: number;
}

export default function AdminLoginLog() {
    const [logs, setLogs] = useState<LoginLogEntry[]>([]);
    const [stats, setStats] = useState<LoginStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [showLogs, setShowLogs] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            // Logs abrufen
            const { data: logsData, error: logsError } = await supabase.rpc('get_recent_admin_logins', { p_limit: 50 });
            if (!logsError && logsData) {
                setLogs(logsData);
            }

            // Statistiken abrufen
            const { data: statsData, error: statsError } = await supabase.rpc('get_admin_login_stats');
            if (!statsError && statsData) {
                setStats(statsData);
            }
        } catch (error) {
            console.error('Failed to load audit log:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleString('de-DE', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });
    };

    return (
        <div className="space-y-4">
            {/* Stats Cards */}
            {stats && (
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20">
                        <div className="text-blue-400 text-xs font-medium mb-1">Total (30d)</div>
                        <div className="text-2xl font-bold text-white">{stats.total_attempts}</div>
                        <div className="text-xs text-gray-400 mt-1">
                            ✅ {stats.successful_logins} / ❌ {stats.failed_logins}
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/20">
                        <div className="text-orange-400 text-xs font-medium mb-1">Last 24h</div>
                        <div className="text-2xl font-bold text-white">{stats.last_24h_attempts}</div>
                        <div className="text-xs text-gray-400 mt-1">
                            ❌ {stats.last_24h_failed} failed
                        </div>
                    </div>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20">
                        <div className="text-purple-400 text-xs font-medium mb-1">Unique IPs</div>
                        <div className="text-2xl font-bold text-white">{stats.unique_ips}</div>
                        <div className="text-xs text-gray-400 mt-1">
                            30 days
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Logs */}
            <button
                onClick={() => setShowLogs(!showLogs)}
                className="w-full px-4 py-3 rounded-xl bg-gradient-to-r from-slate-700/50 to-slate-800/50 border border-slate-600/30 hover:border-slate-500/50 transition-all text-white font-medium text-sm"
            >
                {showLogs ? '📋 Hide Login History' : '📋 Show Login History'} ({logs.length})
            </button>

            {/* Logs Table */}
            {showLogs && (
                <div className="rounded-xl border border-slate-600/30 bg-slate-800/30 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-400">Loading...</div>
                    ) : logs.length === 0 ? (
                        <div className="p-8 text-center text-gray-400">No login attempts logged yet</div>
                    ) : (
                        <div className="max-h-96 overflow-y-auto">
                            <table className="w-full text-sm">
                                <thead className="sticky top-0 bg-slate-900/90 backdrop-blur-sm border-b border-slate-700/50">
                                    <tr className="text-left text-gray-400 text-xs">
                                        <th className="px-4 py-3">Date</th>
                                        <th className="px-4 py-3">Username</th>
                                        <th className="px-4 py-3">IP</th>
                                        <th className="px-4 py-3">Result</th>
                                        <th className="px-4 py-3">Error</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {logs.map((log) => (
                                        <tr
                                            key={log.id}
                                            className="border-b border-slate-700/30 hover:bg-slate-700/20 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-gray-300 text-xs font-mono">
                                                {formatDate(log.created_at)}
                                            </td>
                                            <td className="px-4 py-3 text-white font-medium">
                                                {log.username}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">
                                                {log.ip_address || 'unknown'}
                                            </td>
                                            <td className="px-4 py-3">
                                                {log.success ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-green-500/20 text-green-400 text-xs font-medium">
                                                        ✅ Success
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-500/20 text-red-400 text-xs font-medium">
                                                        ❌ Failed
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 text-xs">
                                                {log.error_message || '-'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
