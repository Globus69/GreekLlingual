// app/admin/content/page.tsx – Admin-Style Content Management

'use client';

import { useState, useEffect, CSSProperties } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { ContentModal } from '@/components/admin/ContentModal';
import { Content, ContentInsert, ContentUpdate } from '@/types/content';
import {
    fetchContent,
    createContent,
    updateContent,
    deleteContent,
    generateCSV,
    importFromCSV,
    bulkImport,
    generateTemplateCSV,
} from '@/lib/supabase/content';

export default function ContentPage() {
    const { user, isAdmin } = useAuth();
    const router = useRouter();

    const [data, setData] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const pageSize = 20;

    // Filters
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [levelFilter, setLevelFilter] = useState<string>('');
    const [difficultyFilter, setDifficultyFilter] = useState<string>('');

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Content | null>(null);

    // Delete confirmation
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

    // Import
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<{ valid: number; invalid: number; errors: any[] } | null>(null);

    // Messages
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        if (!isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, router]);

    useEffect(() => {
        loadData();
    }, [search, typeFilter, levelFilter, difficultyFilter, page]);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await fetchContent({
                search,
                type: typeFilter || undefined,
                level: levelFilter ? [levelFilter] : undefined,
                difficulty: difficultyFilter ? [difficultyFilter] : undefined,
                page,
                pageSize,
            });
            setData(result.data);
            setTotalCount(result.count);
        } catch (error) {
            console.error('Error loading data:', error);
            setErrorMsg('Fehler beim Laden der Daten');
            setTimeout(() => setErrorMsg(null), 3000);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Content) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSave = async (formData: ContentInsert) => {
        try {
            if (editingItem) {
                await updateContent(editingItem.id, formData as ContentUpdate);
                setSuccessMsg('✅ Eintrag aktualisiert');
            } else {
                await createContent(formData);
                setSuccessMsg('✅ Eintrag erstellt');
            }
            setTimeout(() => setSuccessMsg(null), 2500);
            await loadData();
        } catch (error) {
            console.error('Error saving:', error);
            setErrorMsg('❌ Fehler beim Speichern');
            setTimeout(() => setErrorMsg(null), 3000);
        }
    };

    const handleDelete = async (id: string) => {
        if (deleteConfirm !== id) {
            setDeleteConfirm(id);
            setTimeout(() => setDeleteConfirm(null), 3000);
            return;
        }

        try {
            await deleteContent(id);
            setSuccessMsg('✅ Eintrag gelöscht');
            setTimeout(() => setSuccessMsg(null), 2500);
            setDeleteConfirm(null);
            await loadData();
        } catch (error) {
            console.error('Error deleting:', error);
            setErrorMsg('❌ Fehler beim Löschen');
            setTimeout(() => setErrorMsg(null), 3000);
        }
    };

    const handleExport = async () => {
        try {
            const result = await fetchContent({
                search,
                type: typeFilter || undefined,
                level: levelFilter ? [levelFilter] : undefined,
                difficulty: difficultyFilter ? [difficultyFilter] : undefined,
            });
            const csv = generateCSV(result.data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `content-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            setSuccessMsg('✅ CSV Export erfolgreich');
            setTimeout(() => setSuccessMsg(null), 2500);
        } catch (error) {
            console.error('Error exporting:', error);
            setErrorMsg('❌ Export fehlgeschlagen');
            setTimeout(() => setErrorMsg(null), 3000);
        }
    };

    const handleResetFilters = () => {
        setSearch('');
        setTypeFilter('');
        setLevelFilter('');
        setDifficultyFilter('');
        setPage(0);
    };

    const handleDownloadTemplate = () => {
        const csv = generateTemplateCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'content-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setImportFile(file);
        setImporting(true);
        setImportResult(null);

        try {
            const { validItems, invalidItems } = await importFromCSV(file);
            setImportResult({
                valid: validItems.length,
                invalid: invalidItems.length,
                errors: invalidItems,
            });
            setImporting(false);
        } catch (error) {
            console.error('Error parsing CSV:', error);
            setErrorMsg('❌ Fehler beim Parsen der CSV-Datei');
            setTimeout(() => setErrorMsg(null), 3000);
            setImporting(false);
            setIsImportModalOpen(false);
        }
    };

    const handleConfirmImport = async () => {
        if (!importFile) return;

        setImporting(true);
        try {
            const { validItems } = await importFromCSV(importFile);
            const result = await bulkImport(validItems);

            setSuccessMsg(`✅ ${result.success} Einträge importiert`);
            if (result.errors.length > 0) {
                console.error('Import errors:', result.errors);
            }
            setTimeout(() => setSuccessMsg(null), 2500);

            setIsImportModalOpen(false);
            setImportFile(null);
            setImportResult(null);
            await loadData();
        } catch (error) {
            console.error('Error importing:', error);
            setErrorMsg('❌ Fehler beim Importieren');
            setTimeout(() => setErrorMsg(null), 3000);
        } finally {
            setImporting(false);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);
    const filtered = data;

    if (!isAdmin) {
        return null;
    }

    return (
        <div style={containerStyle}>
            {/* Header */}
            <header style={headerStyle}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button onClick={() => router.push('/admin')} style={btnBack}>
                        ←
                    </button>
                    <div>
                        <h1 style={titleStyle}>📦 Content Management</h1>
                        <p style={subtitleStyle}>Vokabeln, Phrasen und Grammatik verwalten</p>
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => setIsImportModalOpen(true)} style={btnSecondary}>
                        📤 Import CSV
                    </button>
                    <button onClick={handleExport} style={btnSecondary}>
                        📥 Export CSV
                    </button>
                    <button onClick={handleCreate} style={btnPrimary}>
                        + Neu
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main style={mainStyle}>
                {/* Messages */}
                {successMsg && <div style={msgSuccess}>{successMsg}</div>}
                {errorMsg && <div style={msgError}>{errorMsg}</div>}

                {/* Stats */}
                <div style={statsGrid}>
                    <div style={statCard}>
                        <div style={statIcon}>📚</div>
                        <div style={statValue}>{totalCount}</div>
                        <div style={statLabel}>Total Items</div>
                    </div>
                    <div style={statCard}>
                        <div style={statIcon}>📄</div>
                        <div style={statValue}>{filtered.length}</div>
                        <div style={statLabel}>Current Page</div>
                    </div>
                    <div style={statCard}>
                        <div style={statIcon}>📊</div>
                        <div style={statValue}>{page + 1} / {totalPages}</div>
                        <div style={statLabel}>Page</div>
                    </div>
                </div>

                {/* Filters */}
                <div style={filterCard}>
                    <div style={{ marginBottom: '12px', fontWeight: 600, fontSize: '13px', color: '#fff' }}>
                        🔍 Filter & Suche
                    </div>

                    <input
                        type="text"
                        value={search}
                        onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                        placeholder="Suche nach English oder Greek..."
                        style={inputStyle}
                    />

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginTop: '10px' }}>
                        <select
                            value={typeFilter}
                            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
                            style={selectStyle}
                        >
                            <option value="">All Types</option>
                            <option value="vocabulary">Vocabulary</option>
                            <option value="phrase">Phrase</option>
                            <option value="grammar">Grammar</option>
                        </select>

                        <select
                            value={levelFilter}
                            onChange={(e) => { setLevelFilter(e.target.value); setPage(0); }}
                            style={selectStyle}
                        >
                            <option value="">All Levels</option>
                            <option value="A1">A1</option>
                            <option value="A2">A2</option>
                            <option value="B1">B1</option>
                            <option value="B2">B2</option>
                            <option value="C1">C1</option>
                            <option value="C2">C2</option>
                        </select>

                        <select
                            value={difficultyFilter}
                            onChange={(e) => { setDifficultyFilter(e.target.value); setPage(0); }}
                            style={selectStyle}
                        >
                            <option value="">All Difficulties</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                        </select>
                    </div>

                    {(search || typeFilter || levelFilter || difficultyFilter) && (
                        <button onClick={handleResetFilters} style={btnResetFilter}>
                            ✕ Filter zurücksetzen
                        </button>
                    )}
                </div>

                {/* Content List */}
                <div style={contentCard}>
                    <div style={{ marginBottom: '12px', fontWeight: 600, fontSize: '13px', color: '#fff' }}>
                        📋 Content Items ({filtered.length})
                    </div>

                    {loading ? (
                        <div style={emptyState}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>⏳</div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#8E8E93' }}>Laden...</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div style={emptyState}>
                            <div style={{ fontSize: '32px', marginBottom: '8px' }}>📭</div>
                            <p style={{ margin: 0, fontSize: '13px', color: '#8E8E93' }}>Keine Einträge gefunden</p>
                        </div>
                    ) : (
                        <div style={listContainer}>
                            {filtered.map((item) => (
                                <div key={item.id} style={listItem}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', flexWrap: 'wrap' }}>
                                            <span style={tagType}>{item.type}</span>
                                            <span style={tagLevel}>{item.level}</span>
                                            <span style={tagDiff}>{item.difficulty}</span>
                                        </div>
                                        <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '2px' }}>
                                            {item.english}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#8E8E93' }}>
                                            {item.greek}
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                        <button onClick={() => handleEdit(item)} style={btnEdit}>
                                            ✏️
                                        </button>
                                        <button
                                            onClick={() => handleDelete(item.id)}
                                            style={deleteConfirm === item.id ? btnDeleteConfirm : btnDelete}
                                        >
                                            {deleteConfirm === item.id ? '⚠️' : '🗑'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div style={paginationStyle}>
                        <button
                            onClick={() => setPage(Math.max(0, page - 1))}
                            disabled={page === 0}
                            style={page === 0 ? btnPageDisabled : btnPage}
                        >
                            ← Zurück
                        </button>
                        <span style={{ fontSize: '12px', color: '#8E8E93' }}>
                            Seite {page + 1} von {totalPages}
                        </span>
                        <button
                            onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                            disabled={page >= totalPages - 1}
                            style={page >= totalPages - 1 ? btnPageDisabled : btnPage}
                        >
                            Weiter →
                        </button>
                    </div>
                )}
            </main>

            {/* Modal */}
            <ContentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                item={editingItem}
                isCreating={!editingItem}
            />

            {/* Import Modal */}
            {isImportModalOpen && (
                <div style={backdropStyle} onClick={() => setIsImportModalOpen(false)}>
                    <div style={importModalStyle} onClick={(e) => e.stopPropagation()}>
                        <div style={headerStyle}>
                            <h2 style={titleStyle}>📤 CSV Import</h2>
                            <button onClick={() => setIsImportModalOpen(false)} style={btnClose}>
                                ✕
                            </button>
                        </div>

                        <div style={bodyStyle}>
                            {/* Template Download */}
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '8px' }}>
                                    1. Lade zuerst die Vorlage herunter
                                </p>
                                <button onClick={handleDownloadTemplate} style={btnSecondary}>
                                    📄 Vorlage herunterladen
                                </button>
                            </div>

                            <div style={dividerStyle} />

                            {/* File Upload */}
                            <div style={{ marginBottom: '20px' }}>
                                <p style={{ fontSize: '12px', color: '#8E8E93', marginBottom: '8px' }}>
                                    2. Wähle deine CSV-Datei aus
                                </p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={handleFileSelect}
                                    style={fileInputStyle}
                                    disabled={importing}
                                />
                            </div>

                            {/* Import Result */}
                            {importResult && (
                                <>
                                    <div style={dividerStyle} />
                                    <div style={{ marginTop: '20px' }}>
                                        <div style={statCard}>
                                            <div style={{ fontSize: '13px', fontWeight: 600, color: '#fff', marginBottom: '8px' }}>
                                                Validierungs-Ergebnis
                                            </div>
                                            <div style={{ display: 'flex', gap: '12px' }}>
                                                <div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#5DD689' }}>
                                                        {importResult.valid}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#8E8E93' }}>Gültig</div>
                                                </div>
                                                <div>
                                                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#FF6B6B' }}>
                                                        {importResult.invalid}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: '#8E8E93' }}>Ungültig</div>
                                                </div>
                                            </div>
                                            {importResult.errors.length > 0 && (
                                                <div style={{ marginTop: '12px', maxHeight: '150px', overflowY: 'auto' }}>
                                                    {importResult.errors.slice(0, 5).map((err, idx) => (
                                                        <div key={idx} style={{ fontSize: '11px', color: '#FF6B6B', marginBottom: '4px' }}>
                                                            Zeile {err.row}: {err.errors.join(', ')}
                                                        </div>
                                                    ))}
                                                    {importResult.errors.length > 5 && (
                                                        <div style={{ fontSize: '11px', color: '#8E8E93' }}>
                                                            ... und {importResult.errors.length - 5} weitere Fehler
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Action Buttons */}
                            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '20px' }}>
                                <button
                                    onClick={() => {
                                        setIsImportModalOpen(false);
                                        setImportFile(null);
                                        setImportResult(null);
                                    }}
                                    style={btnSecondarySmall}
                                    disabled={importing}
                                >
                                    Abbrechen
                                </button>
                                <button
                                    onClick={handleConfirmImport}
                                    style={btnPrimarySmall}
                                    disabled={!importResult || importResult.valid === 0 || importing}
                                >
                                    {importing ? '⏳ Importiere...' : `✅ ${importResult?.valid || 0} Einträge importieren`}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const containerStyle: CSSProperties = {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a1a 0%, #1a1a3e 50%, #0a0a1a 100%)',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
};

const headerStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '16px 24px',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(0, 20, 60, 0.25)',
    backdropFilter: 'blur(20px)',
};

const titleStyle: CSSProperties = {
    fontSize: '18px',
    fontWeight: 700,
    margin: 0,
};

const subtitleStyle: CSSProperties = {
    fontSize: '12px',
    color: '#8E8E93',
    margin: 0,
};

const mainStyle: CSSProperties = {
    padding: '24px',
    maxWidth: '1200px',
    margin: '0 auto',
};

const statsGrid: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '12px',
    marginBottom: '20px',
};

const statCard: CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
    textAlign: 'center',
};

const statIcon: CSSProperties = {
    fontSize: '28px',
    marginBottom: '6px',
};

const statValue: CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    marginBottom: '4px',
};

const statLabel: CSSProperties = {
    fontSize: '11px',
    color: '#8E8E93',
    textTransform: 'uppercase',
};

const filterCard: CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '18px',
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '16px',
};

const contentCard: CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    borderRadius: '16px',
    padding: '18px',
    border: '1px solid rgba(255,255,255,0.08)',
};

const inputStyle: CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '8px 12px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
};

const selectStyle: CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '8px 10px',
    color: '#fff',
    fontSize: '12px',
    outline: 'none',
    cursor: 'pointer',
};

const listContainer: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    maxHeight: '60vh',
    overflowY: 'auto',
};

const listItem: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '10px',
    padding: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
};

const emptyState: CSSProperties = {
    textAlign: 'center',
    padding: '40px',
    color: '#8E8E93',
};

const paginationStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '12px',
    marginTop: '20px',
};

const btnBack: CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '6px 10px',
    color: '#8E8E93',
    fontSize: '16px',
    cursor: 'pointer',
};

const btnPrimary: CSSProperties = {
    background: 'rgba(0, 122, 255, 0.12)',
    border: '1px solid rgba(0, 122, 255, 0.25)',
    borderRadius: '8px',
    padding: '7px 16px',
    color: '#007AFF',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
};

const btnSecondary: CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '7px 14px',
    color: '#8E8E93',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
};

const btnResetFilter: CSSProperties = {
    width: '100%',
    marginTop: '10px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '7px',
    color: '#8E8E93',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
};

const btnEdit: CSSProperties = {
    background: 'rgba(0, 122, 255, 0.1)',
    border: '1px solid rgba(0, 122, 255, 0.2)',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    lineHeight: 1,
};

const btnDelete: CSSProperties = {
    background: 'rgba(255, 59, 48, 0.08)',
    border: '1px solid rgba(255, 59, 48, 0.15)',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    lineHeight: 1,
};

const btnDeleteConfirm: CSSProperties = {
    background: 'rgba(255, 59, 48, 0.25)',
    border: '1px solid rgba(255, 59, 48, 0.5)',
    borderRadius: '6px',
    padding: '5px 10px',
    fontSize: '12px',
    cursor: 'pointer',
    lineHeight: 1,
};

const btnPage: CSSProperties = {
    background: 'rgba(0, 122, 255, 0.12)',
    border: '1px solid rgba(0, 122, 255, 0.25)',
    borderRadius: '8px',
    padding: '6px 14px',
    color: '#007AFF',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'pointer',
};

const btnPageDisabled: CSSProperties = {
    background: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    borderRadius: '8px',
    padding: '6px 14px',
    color: '#636366',
    fontSize: '11px',
    fontWeight: 600,
    cursor: 'not-allowed',
};

const tagType: CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: 600,
    background: 'rgba(88, 86, 214, 0.15)',
    border: '1px solid rgba(88, 86, 214, 0.3)',
    color: '#A29BFE',
};

const tagLevel: CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: 600,
    background: 'rgba(0, 122, 255, 0.15)',
    border: '1px solid rgba(0, 122, 255, 0.3)',
    color: '#5B9BFF',
};

const tagDiff: CSSProperties = {
    display: 'inline-block',
    padding: '2px 8px',
    borderRadius: '6px',
    fontSize: '10px',
    fontWeight: 600,
    background: 'rgba(52, 199, 89, 0.15)',
    border: '1px solid rgba(52, 199, 89, 0.3)',
    color: '#5DD689',
};

const msgSuccess: CSSProperties = {
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '16px',
    background: 'rgba(52, 199, 89, 0.15)',
    border: '1px solid rgba(52, 199, 89, 0.3)',
    color: '#5DD689',
    fontSize: '13px',
    fontWeight: 600,
};

const msgError: CSSProperties = {
    padding: '12px',
    borderRadius: '10px',
    marginBottom: '16px',
    background: 'rgba(255, 59, 48, 0.15)',
    border: '1px solid rgba(255, 59, 48, 0.3)',
    color: '#FF6B6B',
    fontSize: '13px',
    fontWeight: 600,
};

const backdropStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0,0,0,0.85)',
    backdropFilter: 'blur(16px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '20px',
};

const importModalStyle: CSSProperties = {
    width: '100%',
    maxWidth: '500px',
    background: 'rgba(22, 22, 26, 0.98)',
    backdropFilter: 'blur(60px)',
    borderRadius: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
    overflow: 'hidden',
};

const btnClose: CSSProperties = {
    background: 'rgba(255, 59, 48, 0.1)',
    border: '1px solid rgba(255, 59, 48, 0.2)',
    borderRadius: '8px',
    padding: '5px 9px',
    color: '#FF3B30',
    fontSize: '13px',
    cursor: 'pointer',
    lineHeight: 1,
};

const fileInputStyle: CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '10px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
};

const btnSecondarySmall: CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '7px 14px',
    color: '#8E8E93',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
};

const btnPrimarySmall: CSSProperties = {
    background: 'rgba(0, 122, 255, 0.12)',
    border: '1px solid rgba(0, 122, 255, 0.25)',
    borderRadius: '8px',
    padding: '7px 14px',
    color: '#007AFF',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
};
