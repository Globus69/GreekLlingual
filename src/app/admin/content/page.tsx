'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/db/supabase';
import Link from 'next/link';

type Tab = 'import' | 'manage' | 'view';

interface LearningItem {
    id: string;
    type: 'vocabulary' | 'phrase' | 'grammar';
    english: string;
    greek: string;
    phonetic?: string;
    example_en?: string;
    example_gr?: string;
    level: string;
    difficulty: string;
    audio_url?: string;
    created_at: string;
}

export default function AdminContentPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<Tab>('import');
    const [items, setItems] = useState<LearningItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState({
        type: 'all',
        level: 'all',
        difficulty: 'all',
        search: ''
    });
    const [stats, setStats] = useState({
        total: 0,
        vocabulary: 0,
        phrases: 0,
        grammar: 0
    });

    // Add CSS animations for macOS 26 style
    useEffect(() => {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            .animate-fadeIn {
                animation: fadeIn 0.4s ease-out;
            }
            .hover\\:scale-102:hover {
                transform: scale(1.02);
            }
            /* Smooth scrolling */
            html {
                scroll-behavior: smooth;
            }
            /* Custom scrollbar */
            ::-webkit-scrollbar {
                width: 10px;
                height: 10px;
            }
            ::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 10px;
            }
            ::-webkit-scrollbar-thumb:hover {
                background: rgba(255, 255, 255, 0.3);
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Check admin access
    if (!user || user.role !== 'admin') {
        router.push('/login');
        return null;
    }

    useEffect(() => {
        if (activeTab === 'view' || activeTab === 'manage') {
            loadItems();
            loadStats();
        }
    }, [activeTab, filter]);

    const loadItems = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from('learning_items')
                .select('*')
                .order('created_at', { ascending: false });

            if (filter.type !== 'all') {
                query = query.eq('type', filter.type);
            }
            if (filter.level !== 'all') {
                query = query.eq('level', filter.level);
            }
            if (filter.difficulty !== 'all') {
                query = query.eq('difficulty', filter.difficulty);
            }
            if (filter.search) {
                query = query.or(`english.ilike.%${filter.search}%,greek.ilike.%${filter.search}%`);
            }

            const { data, error } = await query.limit(100);

            if (error) throw error;
            setItems(data || []);
        } catch (err) {
            console.error('Error loading items:', err);
        } finally {
            setLoading(false);
        }
    };

    const loadStats = async () => {
        try {
            const { data: allItems, error } = await supabase
                .from('learning_items')
                .select('type');

            if (error) throw error;

            const vocabulary = allItems?.filter(i => i.type === 'vocabulary').length || 0;
            const phrases = allItems?.filter(i => i.type === 'phrase').length || 0;
            const grammar = allItems?.filter(i => i.type === 'grammar').length || 0;

            setStats({
                total: allItems?.length || 0,
                vocabulary,
                phrases,
                grammar
            });
        } catch (err) {
            console.error('Error loading stats:', err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Möchten Sie dieses Element wirklich löschen?')) return;

        try {
            const { error } = await supabase
                .from('learning_items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            loadItems();
            loadStats();
        } catch (err) {
            console.error('Error deleting item:', err);
            alert('Fehler beim Löschen');
        }
    };

    const handleExport = async () => {
        try {
            const { data, error } = await supabase
                .from('learning_items')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            const csv = [
                'type,english,greek,phonetic,example_en,example_gr,level,difficulty,audio_url',
                ...data.map(item =>
                    `${item.type},${item.english},${item.greek},${item.phonetic || ''},${item.example_en || ''},${item.example_gr || ''},${item.level},${item.difficulty},${item.audio_url || ''}`
                )
            ].join('\n');

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `learning-items-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
        } catch (err) {
            console.error('Error exporting:', err);
            alert('Fehler beim Exportieren');
        }
    };

    return (
        <div className="min-h-screen" style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #5f4b8b 100%)',
            position: 'relative'
        }}>
            {/* Ambient Background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl"></div>
            </div>

            {/* Header */}
            <div className="relative bg-white/5 backdrop-blur-2xl border-b border-white/10 shadow-lg">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Link
                                href="/admin"
                                className="group flex items-center justify-center w-10 h-10 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 transition-all duration-300 hover:scale-105 hover:shadow-lg"
                            >
                                <span className="text-white text-xl group-hover:translate-x-[-2px] transition-transform duration-300">←</span>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                    <span className="text-4xl filter drop-shadow-lg">📦</span>
                                    Content Management
                                </h1>
                                <p className="text-sm text-white/70 mt-1 font-medium">Vokabeln, Phrasen und Grammatik verwalten</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-3">
                            {[
                                { value: stats.total, label: 'Gesamt', gradient: 'from-blue-500 to-blue-600' },
                                { value: stats.vocabulary, label: 'Vokabeln', gradient: 'from-purple-500 to-purple-600' },
                                { value: stats.phrases, label: 'Phrasen', gradient: 'from-pink-500 to-pink-600' },
                                { value: stats.grammar, label: 'Grammatik', gradient: 'from-indigo-500 to-indigo-600' }
                            ].map((stat, idx) => (
                                <div
                                    key={idx}
                                    className="group bg-white/10 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/10 hover:bg-white/15 hover:scale-105 transition-all duration-300 hover:shadow-xl cursor-default min-w-[100px]"
                                >
                                    <div className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br ${stat.gradient} group-hover:scale-110 transition-transform duration-300`}>
                                        {stat.value}
                                    </div>
                                    <div className="text-xs text-white/70 font-medium mt-1 tracking-wide uppercase">
                                        {stat.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-6 p-1.5 bg-white/5 rounded-2xl backdrop-blur-xl border border-white/10 w-fit">
                        {[
                            { id: 'import', icon: '📤', label: 'Import' },
                            { id: 'view', icon: '👁️', label: 'Anzeigen' },
                            { id: 'manage', icon: '⚙️', label: 'Verwalten' }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as Tab)}
                                className={`relative px-8 py-3.5 rounded-xl font-semibold transition-all duration-300 ${
                                    activeTab === tab.id
                                        ? 'bg-white text-purple-600 shadow-lg shadow-white/20 scale-105'
                                        : 'text-white/80 hover:text-white hover:bg-white/10 hover:scale-102'
                                }`}
                            >
                                <span className="flex items-center gap-2">
                                    <span className={`text-lg transition-transform duration-300 ${
                                        activeTab === tab.id ? 'scale-110' : ''
                                    }`}>{tab.icon}</span>
                                    <span className="tracking-wide">{tab.label}</span>
                                </span>
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-white rounded-full"></div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="relative max-w-7xl mx-auto px-8 py-10">
                {/* Import Tab */}
                {activeTab === 'import' && (
                    <div className="space-y-8 animate-fadeIn">
                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Link
                                href="/admin/import"
                                className="group bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/20 cursor-pointer"
                            >
                                <div className="text-5xl mb-4 filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">📤</div>
                                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Bulk Import</h3>
                                <p className="text-sm text-white/70 font-medium">CSV oder JSON Dateien hochladen</p>
                                <div className="mt-4 inline-flex items-center text-xs text-white/60 group-hover:text-white/80 transition-colors">
                                    <span>Jetzt starten</span>
                                    <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </Link>

                            <button
                                onClick={handleExport}
                                className="group bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 cursor-pointer text-left"
                            >
                                <div className="text-5xl mb-4 filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">📥</div>
                                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Export</h3>
                                <p className="text-sm text-white/70 font-medium">Alle Items als CSV exportieren</p>
                                <div className="mt-4 inline-flex items-center text-xs text-white/60 group-hover:text-white/80 transition-colors">
                                    <span>Download starten</span>
                                    <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </button>

                            <a
                                href="/templates/vocabulary-template.csv"
                                download
                                className="group bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 cursor-pointer"
                            >
                                <div className="text-5xl mb-4 filter drop-shadow-lg group-hover:scale-110 transition-transform duration-300">📋</div>
                                <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Template</h3>
                                <p className="text-sm text-white/70 font-medium">CSV Vorlage herunterladen</p>
                                <div className="mt-4 inline-flex items-center text-xs text-white/60 group-hover:text-white/80 transition-colors">
                                    <span>Vorlage öffnen</span>
                                    <span className="ml-1 group-hover:translate-x-1 transition-transform">→</span>
                                </div>
                            </a>
                        </div>

                        {/* Documentation */}
                        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-xl">
                            <h3 className="text-2xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
                                <span className="text-3xl filter drop-shadow-lg">📚</span>
                                Dokumentation
                            </h3>
                            <div className="space-y-4 text-white/90">
                                {[
                                    { label: 'Unterstützte Formate', value: 'CSV (mit Headers), JSON' },
                                    { label: 'Erforderliche Felder', value: 'type, english, greek, level, difficulty' },
                                    { label: 'Optionale Felder', value: 'phonetic, example_en, example_gr, audio_url' },
                                    { label: 'Types', value: 'vocabulary, phrase, grammar' },
                                    { label: 'Levels', value: 'A1, A2, B1, B2, C1, C2' },
                                    { label: 'Difficulties', value: 'easy, medium, hard' }
                                ].map((item, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors duration-200">
                                        <span className="text-green-400 text-lg">✅</span>
                                        <div>
                                            <strong className="font-semibold text-white">{item.label}:</strong>
                                            <span className="ml-2 text-white/70">{item.value}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <a
                                href="/docs/IMPORT-GUIDE.md"
                                target="_blank"
                                className="mt-6 inline-flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300"
                            >
                                <span>Vollständige Anleitung</span>
                                <span className="text-lg">→</span>
                            </a>
                        </div>
                    </div>
                )}

                {/* View Tab */}
                {activeTab === 'view' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Filters */}
                        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 border border-white/20 shadow-xl">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="🔍 Suche..."
                                    value={filter.search}
                                    onChange={(e) => setFilter({...filter, search: e.target.value})}
                                    className="bg-white/20 backdrop-blur-xl text-white px-5 py-3.5 rounded-xl border border-white/30 placeholder-white/60 focus:bg-white/25 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 font-medium"
                                />
                                <select
                                    value={filter.type}
                                    onChange={(e) => setFilter({...filter, type: e.target.value})}
                                    className="bg-white/20 backdrop-blur-xl text-white px-5 py-3.5 rounded-xl border border-white/30 focus:bg-white/25 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 font-medium cursor-pointer hover:bg-white/25"
                                >
                                    <option value="all" className="bg-gray-800">Alle Types</option>
                                    <option value="vocabulary" className="bg-gray-800">Vocabulary</option>
                                    <option value="phrase" className="bg-gray-800">Phrase</option>
                                    <option value="grammar" className="bg-gray-800">Grammar</option>
                                </select>
                                <select
                                    value={filter.level}
                                    onChange={(e) => setFilter({...filter, level: e.target.value})}
                                    className="bg-white/20 backdrop-blur-xl text-white px-5 py-3.5 rounded-xl border border-white/30 focus:bg-white/25 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 font-medium cursor-pointer hover:bg-white/25"
                                >
                                    <option value="all" className="bg-gray-800">Alle Levels</option>
                                    <option value="A1" className="bg-gray-800">A1</option>
                                    <option value="A2" className="bg-gray-800">A2</option>
                                    <option value="B1" className="bg-gray-800">B1</option>
                                    <option value="B2" className="bg-gray-800">B2</option>
                                    <option value="C1" className="bg-gray-800">C1</option>
                                    <option value="C2" className="bg-gray-800">C2</option>
                                </select>
                                <select
                                    value={filter.difficulty}
                                    onChange={(e) => setFilter({...filter, difficulty: e.target.value})}
                                    className="bg-white/20 backdrop-blur-xl text-white px-5 py-3.5 rounded-xl border border-white/30 focus:bg-white/25 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 font-medium cursor-pointer hover:bg-white/25"
                                >
                                    <option value="all" className="bg-gray-800">Alle Schwierigkeiten</option>
                                    <option value="easy" className="bg-gray-800">Easy</option>
                                    <option value="medium" className="bg-gray-800">Medium</option>
                                    <option value="hard" className="bg-gray-800">Hard</option>
                                </select>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="space-y-3">
                            {loading ? (
                                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-12 border border-white/20 text-center">
                                    <div className="inline-flex items-center gap-3 text-white">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span className="text-lg font-medium">Laden...</span>
                                    </div>
                                </div>
                            ) : items.length === 0 ? (
                                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-12 border border-white/20 text-center">
                                    <div className="text-6xl mb-4 opacity-50">🔍</div>
                                    <p className="text-white text-lg font-medium">Keine Items gefunden</p>
                                    <p className="text-white/60 text-sm mt-2">Versuchen Sie andere Filter</p>
                                </div>
                            ) : (
                                items.map(item => (
                                    <div
                                        key={item.id}
                                        className="group bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300 hover:scale-[1.01] hover:shadow-xl"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2.5 mb-3">
                                                    <span className="text-xs px-3 py-1.5 bg-blue-500/20 backdrop-blur-xl text-blue-200 rounded-lg border border-blue-400/20 font-semibold uppercase tracking-wide">
                                                        {item.type}
                                                    </span>
                                                    <span className="text-xs px-3 py-1.5 bg-green-500/20 backdrop-blur-xl text-green-200 rounded-lg border border-green-400/20 font-semibold uppercase tracking-wide">
                                                        {item.level}
                                                    </span>
                                                    <span className="text-xs px-3 py-1.5 bg-orange-500/20 backdrop-blur-xl text-orange-200 rounded-lg border border-orange-400/20 font-semibold uppercase tracking-wide">
                                                        {item.difficulty}
                                                    </span>
                                                </div>
                                                <div className="text-white font-bold text-lg mb-1">{item.english}</div>
                                                <div className="text-blue-200 text-base font-medium">{item.greek}</div>
                                                {item.phonetic && (
                                                    <div className="text-sm text-white/60 italic mt-2 font-medium">{item.phonetic}</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {items.length >= 100 && (
                            <div className="bg-white/10 backdrop-blur-2xl rounded-2xl p-4 border border-white/20 text-center">
                                <p className="text-white/80 text-sm font-medium">
                                    💡 Zeige ersten 100 Items. Verwenden Sie Filter für mehr.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Manage Tab */}
                {activeTab === 'manage' && (
                    <div className="space-y-6 animate-fadeIn">
                        {/* Actions */}
                        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-8 border border-white/20 shadow-xl">
                            <h3 className="text-2xl font-bold text-white mb-6 tracking-tight flex items-center gap-3">
                                <span className="text-3xl filter drop-shadow-lg">⚙️</span>
                                Verwaltungs-Aktionen
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleExport}
                                    className="group bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                                >
                                    <span className="text-2xl group-hover:scale-110 transition-transform">📥</span>
                                    <span className="tracking-wide">Alle exportieren (CSV)</span>
                                </button>
                                <button
                                    onClick={loadStats}
                                    className="group bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-3"
                                >
                                    <span className="text-2xl group-hover:rotate-180 transition-transform duration-500">🔄</span>
                                    <span className="tracking-wide">Statistiken aktualisieren</span>
                                </button>
                            </div>
                        </div>

                        {/* Filters */}
                        <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-6 border border-white/20 shadow-xl">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="🔍 Suche..."
                                    value={filter.search}
                                    onChange={(e) => setFilter({...filter, search: e.target.value})}
                                    className="bg-white/20 backdrop-blur-xl text-white px-5 py-3.5 rounded-xl border border-white/30 placeholder-white/60 focus:bg-white/25 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 font-medium"
                                />
                                <select
                                    value={filter.type}
                                    onChange={(e) => setFilter({...filter, type: e.target.value})}
                                    className="bg-white/20 backdrop-blur-xl text-white px-5 py-3.5 rounded-xl border border-white/30 focus:bg-white/25 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 font-medium cursor-pointer hover:bg-white/25"
                                >
                                    <option value="all" className="bg-gray-800">Alle Types</option>
                                    <option value="vocabulary" className="bg-gray-800">Vocabulary</option>
                                    <option value="phrase" className="bg-gray-800">Phrase</option>
                                    <option value="grammar" className="bg-gray-800">Grammar</option>
                                </select>
                                <select
                                    value={filter.level}
                                    onChange={(e) => setFilter({...filter, level: e.target.value})}
                                    className="bg-white/20 backdrop-blur-xl text-white px-5 py-3.5 rounded-xl border border-white/30 focus:bg-white/25 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 font-medium cursor-pointer hover:bg-white/25"
                                >
                                    <option value="all" className="bg-gray-800">Alle Levels</option>
                                    <option value="A1" className="bg-gray-800">A1</option>
                                    <option value="A2" className="bg-gray-800">A2</option>
                                    <option value="B1" className="bg-gray-800">B1</option>
                                    <option value="B2" className="bg-gray-800">B2</option>
                                    <option value="C1" className="bg-gray-800">C1</option>
                                    <option value="C2" className="bg-gray-800">C2</option>
                                </select>
                                <select
                                    value={filter.difficulty}
                                    onChange={(e) => setFilter({...filter, difficulty: e.target.value})}
                                    className="bg-white/20 backdrop-blur-xl text-white px-5 py-3.5 rounded-xl border border-white/30 focus:bg-white/25 focus:border-white/40 focus:outline-none focus:ring-2 focus:ring-white/20 transition-all duration-300 font-medium cursor-pointer hover:bg-white/25"
                                >
                                    <option value="all" className="bg-gray-800">Alle Schwierigkeiten</option>
                                    <option value="easy" className="bg-gray-800">Easy</option>
                                    <option value="medium" className="bg-gray-800">Medium</option>
                                    <option value="hard" className="bg-gray-800">Hard</option>
                                </select>
                            </div>
                        </div>

                        {/* Items List with Delete */}
                        <div className="space-y-3">
                            {loading ? (
                                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-12 border border-white/20 text-center">
                                    <div className="inline-flex items-center gap-3 text-white">
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                        <span className="text-lg font-medium">Laden...</span>
                                    </div>
                                </div>
                            ) : items.length === 0 ? (
                                <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-12 border border-white/20 text-center">
                                    <div className="text-6xl mb-4 opacity-50">🔍</div>
                                    <p className="text-white text-lg font-medium">Keine Items gefunden</p>
                                    <p className="text-white/60 text-sm mt-2">Versuchen Sie andere Filter</p>
                                </div>
                            ) : (
                                items.map(item => (
                                    <div
                                        key={item.id}
                                        className="group bg-white/10 backdrop-blur-2xl rounded-2xl p-6 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-all duration-300"
                                    >
                                        <div className="flex items-center justify-between gap-6">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2.5 mb-3">
                                                    <span className="text-xs px-3 py-1.5 bg-blue-500/20 backdrop-blur-xl text-blue-200 rounded-lg border border-blue-400/20 font-semibold uppercase tracking-wide">
                                                        {item.type}
                                                    </span>
                                                    <span className="text-xs px-3 py-1.5 bg-green-500/20 backdrop-blur-xl text-green-200 rounded-lg border border-green-400/20 font-semibold uppercase tracking-wide">
                                                        {item.level}
                                                    </span>
                                                    <span className="text-xs px-3 py-1.5 bg-orange-500/20 backdrop-blur-xl text-orange-200 rounded-lg border border-orange-400/20 font-semibold uppercase tracking-wide">
                                                        {item.difficulty}
                                                    </span>
                                                </div>
                                                <div className="text-white font-bold text-lg mb-1">{item.english}</div>
                                                <div className="text-blue-200 text-base font-medium">{item.greek}</div>
                                                {item.phonetic && (
                                                    <div className="text-sm text-white/60 italic mt-2 font-medium">{item.phonetic}</div>
                                                )}
                                                {item.example_en && (
                                                    <div className="text-sm text-white/70 mt-3 p-3 bg-white/5 rounded-lg border border-white/10">
                                                        <span className="font-semibold">Example:</span> {item.example_en}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="group/btn bg-red-500/20 backdrop-blur-xl hover:bg-red-500/30 text-red-200 hover:text-white px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 hover:shadow-lg border border-red-400/20 hover:border-red-400/40 flex items-center gap-2"
                                            >
                                                <span className="text-lg group-hover/btn:scale-110 transition-transform">🗑️</span>
                                                <span>Löschen</span>
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
