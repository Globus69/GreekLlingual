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
        <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            {/* Header */}
            <div className="bg-white/10 backdrop-blur-md border-b border-white/10">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin" className="text-white hover:text-blue-200 transition-colors">
                                <span className="text-2xl">←</span>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-white">📦 Content Management</h1>
                                <p className="text-sm text-blue-200">Vokabeln, Phrasen und Grammatik verwalten</p>
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="flex gap-4 text-white">
                            <div className="text-center">
                                <div className="text-2xl font-bold">{stats.total}</div>
                                <div className="text-xs text-blue-200">Gesamt</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{stats.vocabulary}</div>
                                <div className="text-xs text-blue-200">Vokabeln</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{stats.phrases}</div>
                                <div className="text-xs text-blue-200">Phrasen</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-bold">{stats.grammar}</div>
                                <div className="text-xs text-blue-200">Grammatik</div>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mt-4">
                        <button
                            onClick={() => setActiveTab('import')}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                activeTab === 'import'
                                    ? 'bg-white text-purple-600'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            📤 Import
                        </button>
                        <button
                            onClick={() => setActiveTab('view')}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                activeTab === 'view'
                                    ? 'bg-white text-purple-600'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            👁️ Anzeigen
                        </button>
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                                activeTab === 'manage'
                                    ? 'bg-white text-purple-600'
                                    : 'bg-white/10 text-white hover:bg-white/20'
                            }`}
                        >
                            ⚙️ Verwalten
                        </button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                {/* Import Tab */}
                {activeTab === 'import' && (
                    <div className="space-y-6">
                        {/* Quick Actions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Link
                                href="/admin/import"
                                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                            >
                                <div className="text-4xl mb-3">📤</div>
                                <h3 className="text-xl font-bold text-white mb-2">Bulk Import</h3>
                                <p className="text-sm text-blue-200">CSV oder JSON Dateien hochladen</p>
                            </Link>

                            <button
                                onClick={handleExport}
                                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer text-left"
                            >
                                <div className="text-4xl mb-3">📥</div>
                                <h3 className="text-xl font-bold text-white mb-2">Export</h3>
                                <p className="text-sm text-blue-200">Alle Items als CSV exportieren</p>
                            </button>

                            <a
                                href="/templates/vocabulary-template.csv"
                                download
                                className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 hover:bg-white/20 transition-all cursor-pointer"
                            >
                                <div className="text-4xl mb-3">📋</div>
                                <h3 className="text-xl font-bold text-white mb-2">Template</h3>
                                <p className="text-sm text-blue-200">CSV Vorlage herunterladen</p>
                            </a>
                        </div>

                        {/* Documentation */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <h3 className="text-xl font-bold text-white mb-4">📚 Dokumentation</h3>
                            <div className="space-y-2 text-white">
                                <p>✅ <strong>Unterstützte Formate:</strong> CSV (mit Headers), JSON</p>
                                <p>✅ <strong>Erforderliche Felder:</strong> type, english, greek, level, difficulty</p>
                                <p>✅ <strong>Optionale Felder:</strong> phonetic, example_en, example_gr, audio_url</p>
                                <p>✅ <strong>Types:</strong> vocabulary, phrase, grammar</p>
                                <p>✅ <strong>Levels:</strong> A1, A2, B1, B2, C1, C2</p>
                                <p>✅ <strong>Difficulties:</strong> easy, medium, hard</p>
                            </div>
                            <a
                                href="/docs/IMPORT-GUIDE.md"
                                target="_blank"
                                className="mt-4 inline-block bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold"
                            >
                                Vollständige Anleitung →
                            </a>
                        </div>
                    </div>
                )}

                {/* View Tab */}
                {activeTab === 'view' && (
                    <div className="space-y-4">
                        {/* Filters */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="Suche..."
                                    value={filter.search}
                                    onChange={(e) => setFilter({...filter, search: e.target.value})}
                                    className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30 placeholder-white/50"
                                />
                                <select
                                    value={filter.type}
                                    onChange={(e) => setFilter({...filter, type: e.target.value})}
                                    className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30"
                                >
                                    <option value="all">Alle Types</option>
                                    <option value="vocabulary">Vocabulary</option>
                                    <option value="phrase">Phrase</option>
                                    <option value="grammar">Grammar</option>
                                </select>
                                <select
                                    value={filter.level}
                                    onChange={(e) => setFilter({...filter, level: e.target.value})}
                                    className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30"
                                >
                                    <option value="all">Alle Levels</option>
                                    <option value="A1">A1</option>
                                    <option value="A2">A2</option>
                                    <option value="B1">B1</option>
                                    <option value="B2">B2</option>
                                    <option value="C1">C1</option>
                                    <option value="C2">C2</option>
                                </select>
                                <select
                                    value={filter.difficulty}
                                    onChange={(e) => setFilter({...filter, difficulty: e.target.value})}
                                    className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30"
                                >
                                    <option value="all">Alle Schwierigkeiten</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="space-y-2">
                            {loading ? (
                                <div className="text-white text-center py-8">Laden...</div>
                            ) : items.length === 0 ? (
                                <div className="text-white text-center py-8">Keine Items gefunden</div>
                            ) : (
                                items.map(item => (
                                    <div
                                        key={item.id}
                                        className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20 hover:bg-white/20 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-xs px-2 py-1 bg-blue-500/30 text-blue-200 rounded">
                                                        {item.type}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-green-500/30 text-green-200 rounded">
                                                        {item.level}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-orange-500/30 text-orange-200 rounded">
                                                        {item.difficulty}
                                                    </span>
                                                </div>
                                                <div className="text-white font-semibold">{item.english}</div>
                                                <div className="text-blue-200">{item.greek}</div>
                                                {item.phonetic && (
                                                    <div className="text-sm text-blue-300 italic">{item.phonetic}</div>
                                                )}
                                            </div>
                                            {activeTab === 'manage' && (
                                                <button
                                                    onClick={() => handleDelete(item.id)}
                                                    className="bg-red-500/20 hover:bg-red-500/40 text-red-200 px-4 py-2 rounded-lg font-semibold"
                                                >
                                                    🗑️ Löschen
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {items.length >= 100 && (
                            <div className="text-white text-center text-sm">
                                Zeige ersten 100 Items. Verwenden Sie Filter für mehr.
                            </div>
                        )}
                    </div>
                )}

                {/* Manage Tab */}
                {activeTab === 'manage' && (
                    <div className="space-y-4">
                        {/* Actions */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
                            <h3 className="text-xl font-bold text-white mb-4">⚙️ Verwaltungs-Aktionen</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={handleExport}
                                    className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
                                >
                                    📥 Alle exportieren (CSV)
                                </button>
                                <button
                                    onClick={loadStats}
                                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold"
                                >
                                    🔄 Statistiken aktualisieren
                                </button>
                            </div>
                        </div>

                        {/* Same filters and items list as View tab */}
                        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <input
                                    type="text"
                                    placeholder="Suche..."
                                    value={filter.search}
                                    onChange={(e) => setFilter({...filter, search: e.target.value})}
                                    className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30 placeholder-white/50"
                                />
                                <select
                                    value={filter.type}
                                    onChange={(e) => setFilter({...filter, type: e.target.value})}
                                    className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30"
                                >
                                    <option value="all">Alle Types</option>
                                    <option value="vocabulary">Vocabulary</option>
                                    <option value="phrase">Phrase</option>
                                    <option value="grammar">Grammar</option>
                                </select>
                                <select
                                    value={filter.level}
                                    onChange={(e) => setFilter({...filter, level: e.target.value})}
                                    className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30"
                                >
                                    <option value="all">Alle Levels</option>
                                    <option value="A1">A1</option>
                                    <option value="A2">A2</option>
                                    <option value="B1">B1</option>
                                    <option value="B2">B2</option>
                                    <option value="C1">C1</option>
                                    <option value="C2">C2</option>
                                </select>
                                <select
                                    value={filter.difficulty}
                                    onChange={(e) => setFilter({...filter, difficulty: e.target.value})}
                                    className="bg-white/20 text-white px-4 py-2 rounded-lg border border-white/30"
                                >
                                    <option value="all">Alle Schwierigkeiten</option>
                                    <option value="easy">Easy</option>
                                    <option value="medium">Medium</option>
                                    <option value="hard">Hard</option>
                                </select>
                            </div>
                        </div>

                        {/* Items List with Delete */}
                        <div className="space-y-2">
                            {loading ? (
                                <div className="text-white text-center py-8">Laden...</div>
                            ) : items.length === 0 ? (
                                <div className="text-white text-center py-8">Keine Items gefunden</div>
                            ) : (
                                items.map(item => (
                                    <div
                                        key={item.id}
                                        className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className="text-xs px-2 py-1 bg-blue-500/30 text-blue-200 rounded">
                                                        {item.type}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-green-500/30 text-green-200 rounded">
                                                        {item.level}
                                                    </span>
                                                    <span className="text-xs px-2 py-1 bg-orange-500/30 text-orange-200 rounded">
                                                        {item.difficulty}
                                                    </span>
                                                </div>
                                                <div className="text-white font-semibold">{item.english}</div>
                                                <div className="text-blue-200">{item.greek}</div>
                                                {item.phonetic && (
                                                    <div className="text-sm text-blue-300 italic">{item.phonetic}</div>
                                                )}
                                                {item.example_en && (
                                                    <div className="text-sm text-blue-200 mt-2">
                                                        Example: {item.example_en}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="bg-red-500/20 hover:bg-red-500/40 text-red-200 px-4 py-2 rounded-lg font-semibold transition-all"
                                            >
                                                🗑️ Löschen
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
