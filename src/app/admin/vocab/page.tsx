'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import VocabStats from '@/components/admin/VocabStats';
import VocabTable from '@/components/admin/VocabTable';
import VocabModal from '@/components/admin/VocabModal';
import VocabImportModal from '@/components/admin/VocabImportModal';
import VocabBulkEditModal from '@/components/admin/VocabBulkEditModal';
import { fetchVocabList, exportCSV, deleteVocabEntry, bulkDeleteVocab } from '@/lib/api/vocab';
import type { VocabFilters, VocabEntry } from '@/types/vocabulary';
import { toast } from 'sonner';

export default function VocabularyManagementPage() {
    // State management
    const [entries, setEntries] = useState<VocabEntry[]>([]);
    const [filters, setFilters] = useState<VocabFilters>({});
    const [loading, setLoading] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [showBulkEditModal, setShowBulkEditModal] = useState(false);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [editEntry, setEditEntry] = useState<VocabEntry | null>(null);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);

    // Auth check
    const { isAdmin, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && !isAdmin) {
            router.push('/admin');
        }
    }, [authLoading, isAdmin, router]);

    // Load entries
    useEffect(() => {
        if (isAdmin) {
            loadEntries();
        }
    }, [filters, page, isAdmin]);

    const loadEntries = async () => {
        try {
            setLoading(true);
            const response = await fetchVocabList({ ...filters, page });
            setEntries(response.data);
            setTotal(response.total);
        } catch (error) {
            console.error('Load entries error:', error);
            toast.error('Failed to load vocabulary');
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const blob = await exportCSV(filters);
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `vocabulary-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Exported successfully');
        } catch (error) {
            console.error('Export error:', error);
            toast.error('Export failed');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this entry?')) return;

        try {
            await deleteVocabEntry(id);
            toast.success('Entry deleted');
            loadEntries();
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('Delete failed');
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;
        if (!confirm(`Delete ${selectedIds.length} entries?`)) return;

        try {
            await bulkDeleteVocab(selectedIds);
            toast.success(`${selectedIds.length} entries deleted`);
            setSelectedIds([]);
            loadEntries();
        } catch (error) {
            console.error('Bulk delete error:', error);
            toast.error('Bulk delete failed');
        }
    };

    if (authLoading || (!authLoading && !isAdmin)) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #0a0a1a 0%, #0f1a3e 50%, #0a0a1a 100%)',
                color: '#fff',
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
                    <p style={{ fontSize: '16px', color: '#8E8E93' }}>Loading...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0a0a1a 0%, #0f1a3e 50%, #0a0a1a 100%)',
            color: '#fff',
            padding: '24px',
        }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '32px',
                flexWrap: 'wrap',
                gap: '16px',
            }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
                        📚 Vocabulary Management
                    </h1>
                    <p style={{ fontSize: '14px', color: '#8E8E93' }}>
                        {total} entries • Multilingual (EN, DE, ES, RU)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button onClick={() => setShowCreateModal(true)} style={primaryButtonStyle}>
                        + Create Entry
                    </button>
                    <button onClick={() => setShowImportModal(true)} style={secondaryButtonStyle}>
                        Import CSV
                    </button>
                    <button onClick={handleExport} style={secondaryButtonStyle}>
                        Export CSV
                    </button>
                    {selectedIds.length > 0 && (
                        <>
                            <button onClick={() => setShowBulkEditModal(true)} style={secondaryButtonStyle}>
                                Bulk Edit ({selectedIds.length})
                            </button>
                            <button onClick={handleBulkDelete} style={deleteButtonStyle}>
                                Delete ({selectedIds.length})
                            </button>
                        </>
                    )}
                    <button onClick={() => router.push('/admin')} style={secondaryButtonStyle}>
                        ← Back
                    </button>
                </div>
            </header>

            {/* Statistics */}
            <VocabStats />

            {/* Filters */}
            <div style={{
                background: 'rgba(255,255,255,0.04)',
                borderRadius: '16px',
                padding: '20px',
                border: '1px solid rgba(255,255,255,0.08)',
                marginBottom: '24px',
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '12px',
                }}>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={filters.search || ''}
                        onChange={(e) => {
                            setFilters({ ...filters, search: e.target.value });
                            setPage(1);
                        }}
                        style={inputStyle}
                    />
                    <select
                        value={filters.level || 'All'}
                        onChange={(e) => {
                            setFilters({ ...filters, level: e.target.value as any });
                            setPage(1);
                        }}
                        style={inputStyle}
                    >
                        <option value="All">All Levels</option>
                        <option value="A1">A1</option>
                        <option value="A2">A2</option>
                        <option value="B1">B1</option>
                        <option value="B2">B2</option>
                        <option value="C1">C1</option>
                        <option value="C2">C2</option>
                    </select>
                    <select
                        value={filters.difficulty || 'All'}
                        onChange={(e) => {
                            setFilters({ ...filters, difficulty: e.target.value as any });
                            setPage(1);
                        }}
                        style={inputStyle}
                    >
                        <option value="All">All Difficulties</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <button
                        onClick={() => {
                            setFilters({});
                            setPage(1);
                        }}
                        style={{
                            ...secondaryButtonStyle,
                            fontSize: '13px',
                        }}
                    >
                        Clear Filters
                    </button>
                </div>
            </div>

            {/* Table */}
            <VocabTable
                entries={entries}
                loading={loading}
                selectedIds={selectedIds}
                onSelectIds={setSelectedIds}
                onEdit={(entry) => setEditEntry(entry)}
                onDelete={handleDelete}
                onRefresh={loadEntries}
            />

            {/* Pagination */}
            {total > 20 && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '12px',
                    marginTop: '24px',
                }}>
                    <button
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        style={{
                            ...secondaryButtonStyle,
                            opacity: page === 1 ? 0.5 : 1,
                            cursor: page === 1 ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Previous
                    </button>
                    <span style={{
                        padding: '12px 24px',
                        background: 'rgba(255,255,255,0.04)',
                        borderRadius: '12px',
                        fontSize: '14px',
                    }}>
                        Page {page} / {Math.ceil(total / 20)}
                    </span>
                    <button
                        onClick={() => setPage(p => p + 1)}
                        disabled={page >= Math.ceil(total / 20)}
                        style={{
                            ...secondaryButtonStyle,
                            opacity: page >= Math.ceil(total / 20) ? 0.5 : 1,
                            cursor: page >= Math.ceil(total / 20) ? 'not-allowed' : 'pointer',
                        }}
                    >
                        Next
                    </button>
                </div>
            )}

            {/* Modals */}
            {showCreateModal && (
                <VocabModal
                    mode="create"
                    onClose={() => setShowCreateModal(false)}
                    onSave={() => {
                        setShowCreateModal(false);
                        loadEntries();
                        toast.success('Entry created');
                    }}
                />
            )}

            {editEntry && (
                <VocabModal
                    mode="edit"
                    entry={editEntry}
                    onClose={() => setEditEntry(null)}
                    onSave={() => {
                        setEditEntry(null);
                        loadEntries();
                        toast.success('Entry updated');
                    }}
                />
            )}

            {showImportModal && (
                <VocabImportModal
                    onClose={() => setShowImportModal(false)}
                    onSuccess={() => {
                        setShowImportModal(false);
                        loadEntries();
                    }}
                />
            )}

            {showBulkEditModal && (
                <VocabBulkEditModal
                    selectedIds={selectedIds}
                    onClose={() => setShowBulkEditModal(false)}
                    onSave={() => {
                        setShowBulkEditModal(false);
                        setSelectedIds([]);
                        loadEntries();
                        toast.success('Bulk update complete');
                    }}
                />
            )}
        </div>
    );
}

// Styles
const primaryButtonStyle: React.CSSProperties = {
    background: 'rgba(0, 122, 255, 0.15)',
    border: '1px solid rgba(0, 122, 255, 0.3)',
    borderRadius: '12px',
    padding: '12px 20px',
    color: '#007AFF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
};

const secondaryButtonStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '12px 20px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
};

const deleteButtonStyle: React.CSSProperties = {
    background: 'rgba(255, 59, 48, 0.15)',
    border: '1px solid rgba(255, 59, 48, 0.3)',
    borderRadius: '12px',
    padding: '12px 20px',
    color: '#FF3B30',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
};

const inputStyle: React.CSSProperties = {
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: '14px',
    width: '100%',
};
