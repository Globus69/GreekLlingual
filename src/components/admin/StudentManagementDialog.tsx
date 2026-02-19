"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useTranslation } from '@/lib/use-translation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
    id: string;
    name: string;
    email: string;
    whatsapp: string;
    pin?: string;
    role: string;
    level: string;
    difficulty: string;
    performance_index: string;
    preferred_locale?: string;
    locked_until?: string | null;
    failed_attempts?: number;
}

interface StudentFormData {
    name: string;
    email: string;
    whatsapp: string;
    pin: string;
    level: string;
    difficulty: string;
    preferred_locale: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const DIFFICULTIES = ['easy', 'middle', 'hard'];
const LOCALES = [
    { code: 'en', label: 'English 🇬🇧' },
    { code: 'ru', label: 'Русский 🇷🇺' },
    { code: 'el', label: 'Ελληνικά 🇬🇷' },
    { code: 'de', label: 'Deutsch 🇩🇪' },
    { code: 'es', label: 'Español 🇪🇸' }
];

// Honeypot-PINs (verboten, lösen sofort Alarm aus)
const HONEYPOT_PINS = new Set([
    '0000', '1111', '2222', '3333', '4444', '5555',
    '6666', '7777', '8888', '9999', '1234', '4321',
    '1122', '2211', '5678'
]);

const EMPTY_FORM: StudentFormData = {
    name: '',
    email: '',
    whatsapp: '',
    pin: '',
    level: 'A1',
    difficulty: 'easy',
    preferred_locale: 'en',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function StudentManagementDialog({ open, onClose }: Props) {
    const { t } = useTranslation();

    // ── State ─────────────────────────────────────────────────────────────────
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const [mode, setMode] = useState<'list' | 'add' | 'edit'>('list');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<StudentFormData>(EMPTY_FORM);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMsg, setSuccessMsg] = useState<string | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
    const [studentStats, setStudentStats] = useState<Record<string, any>>({});
    const [loadingStats, setLoadingStats] = useState<string | null>(null);
    const [pinCheckMsg, setPinCheckMsg] = useState<string | null>(null);

    // ── Computed ──────────────────────────────────────────────────────────────
    const indexKey = `${form.level}-${form.difficulty}`;

    // ── PIN Duplikat-Check (automatisch bei Eingabe) ──────────────────────────
    useEffect(() => {
        const checkPinDuplicate = async () => {
            // Nur prüfen wenn PIN 4 Ziffern hat
            if (form.pin.length !== 4) {
                setPinCheckMsg(null);
                return;
            }

            // Honeypot-Check
            if (HONEYPOT_PINS.has(form.pin)) {
                setPinCheckMsg('⚠️ PIN ungültig (Sicherheitsregel)');
                return;
            }

            // Bei Edit: Wenn PIN unverändert, kein Check nötig
            if (mode === 'edit' && editingId) {
                const currentStudent = students.find(s => s.id === editingId);
                if (currentStudent?.pin === form.pin) {
                    setPinCheckMsg('✓ PIN unverändert');
                    return;
                }
            }

            // Duplikat-Check via RPC
            try {
                const { data, error } = await supabase.rpc('is_pin_taken', {
                    p_pin: form.pin,
                    p_exclude_user_id: mode === 'edit' ? editingId : null
                });

                if (error) {
                    console.error('PIN check error:', error);
                    setPinCheckMsg(null);
                    return;
                }

                if (data === true) {
                    setPinCheckMsg('❌ PIN bereits vergeben');
                } else {
                    setPinCheckMsg('✓ PIN verfügbar');
                }
            } catch (err) {
                console.error('PIN check failed:', err);
                setPinCheckMsg(null);
            }
        };

        checkPinDuplicate();
    }, [form.pin, mode, editingId, students]);

    // ── PIN Generator (4-stellig) mit Honeypot- und Duplikat-Check ──────────
    const generatePin = async () => {
        let pin = '';
        let attempts = 0;
        const maxAttempts = 50;

        while (attempts < maxAttempts) {
            pin = String(Math.floor(1000 + Math.random() * 9000));

            // Check 1: Honeypot-PIN?
            if (HONEYPOT_PINS.has(pin)) {
                attempts++;
                continue;
            }

            // Check 2: PIN bereits vergeben? (Server-Check)
            try {
                const { data, error } = await supabase.rpc('is_pin_taken', {
                    p_pin: pin,
                    p_exclude_user_id: editingId || null,
                });

                if (!error && data === false) {
                    // PIN ist frei
                    break;
                }
            } catch (err) {
                console.warn('PIN duplicate check failed:', err);
                // Bei Fehler: PIN trotzdem verwenden (Server prüft später nochmal)
                break;
            }

            attempts++;
        }

        if (attempts >= maxAttempts) {
            setError('Konnte keine sichere PIN generieren. Bitte versuchen Sie es später erneut.');
            return;
        }

        setForm(f => ({ ...f, pin }));
        setSuccessMsg(`Neue PIN generiert: ${pin}`);
        setTimeout(() => setSuccessMsg(null), 2500);
    };

    // ── Student Stats laden (via RPC) ────────────────────────────────────────
    const loadStudentStats = async (studentId: string) => {
        if (studentStats[studentId]) {
            // Toggle: Stats ausblenden wenn bereits geladen
            setStudentStats(prev => {
                const copy = { ...prev };
                delete copy[studentId];
                return copy;
            });
            return;
        }
        setLoadingStats(studentId);
        try {
            const { data, error } = await supabase.rpc('get_student_stats', {
                p_student_id: studentId,
            });
            if (!error && data) {
                setStudentStats(prev => ({ ...prev, [studentId]: data }));
            } else {
                setStudentStats(prev => ({ ...prev, [studentId]: { error: 'Not available' } }));
            }
        } catch {
            setStudentStats(prev => ({ ...prev, [studentId]: { error: 'Failed' } }));
        }
        setLoadingStats(null);
    };

    // ── CSV Export ────────────────────────────────────────────────────────────
    const exportCSV = () => {
        const headers = ['Name', 'Email', 'WhatsApp', 'Level', 'Difficulty', 'Language', 'Index-Key'];
        const rows = students.map(s => [
            s.name || '',
            s.email || '',
            s.whatsapp || '',
            s.level || 'A1',
            s.difficulty || 'easy',
            s.preferred_locale || 'en',
            s.performance_index || '',
        ]);
        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.map(cell => `"${(cell || '').replace(/"/g, '""')}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    };

    // ── Fetch Students (via RPC – umgeht RLS) ────────────────────────────────
    const fetchStudents = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Primaer: RPC-Funktion list_students (SECURITY DEFINER)
            const { data: rpcData, error: rpcErr } = await supabase.rpc('list_students');

            if (!rpcErr && rpcData) {
                // rpcData ist JSON-Array oder null
                const students = Array.isArray(rpcData) ? rpcData : [];
                setStudents(students);
            } else {
                // Fallback: Direkter Query (funktioniert nur wenn RLS es erlaubt)
                console.warn('RPC list_students failed, trying direct query:', rpcErr);
                const { data, error: fetchErr } = await supabase
                    .from('users')
                    .select('id, name, email, whatsapp, pin, role, level, difficulty, performance_index, preferred_locale, locked_until, failed_attempts')
                    .eq('role', 'student')
                    .order('name', { ascending: true });

                if (fetchErr) {
                    console.warn('Direct fetch also failed:', fetchErr);
                    setStudents([]);
                } else {
                    setStudents(data || []);
                }
            }
        } catch (err) {
            console.warn('Could not fetch students:', err);
            setStudents([]);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        if (open) {
            fetchStudents();
            setMode('list');
            setSearch('');
            setError(null);
            setSuccessMsg(null);
        }
    }, [open, fetchStudents]);

    // ── Filtered Students ─────────────────────────────────────────────────────
    const filtered = students.filter(s => {
        const q = search.toLowerCase();
        return s.name?.toLowerCase().includes(q) ||
               s.email?.toLowerCase().includes(q) ||
               s.whatsapp?.toLowerCase().includes(q);
    });

    // ── Handlers ──────────────────────────────────────────────────────────────
    const openAdd = async () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setMode('add');
        setError(null);
        setSuccessMsg(null);
        setPinCheckMsg(null);

        // Auto-generiere sichere PIN beim Öffnen des Add-Dialogs
        // Verzögert, damit Dialog zuerst erscheint
        setTimeout(async () => {
            let pin = '';
            let attempts = 0;
            const maxAttempts = 50;

            while (attempts < maxAttempts) {
                pin = String(Math.floor(1000 + Math.random() * 9000));

                // Check: Honeypot-PIN?
                if (HONEYPOT_PINS.has(pin)) {
                    attempts++;
                    continue;
                }

                // Check: PIN bereits vergeben?
                try {
                    const { data, error } = await supabase.rpc('is_pin_taken', {
                        p_pin: pin,
                        p_exclude_user_id: null,
                    });

                    if (!error && data === false) {
                        // PIN ist frei
                        break;
                    }
                } catch {
                    // Bei Fehler: PIN trotzdem verwenden
                    break;
                }

                attempts++;
            }

            if (attempts < maxAttempts) {
                setForm(f => ({ ...f, pin }));
            }
        }, 100);
    };

    const openEdit = (student: Student) => {
        setForm({
            name: student.name || '',
            email: student.email || '',
            whatsapp: student.whatsapp || '',
            pin: student.pin || '',
            level: student.level || 'A1',
            difficulty: student.difficulty || 'easy',
            preferred_locale: student.preferred_locale || 'en',
        });
        setEditingId(student.id);
        setMode('edit');
        setError(null);
        setSuccessMsg(null);
        setPinCheckMsg(null);
    };

    const handleSave = async () => {
        setError(null);
        setSuccessMsg(null);

        // Validierung
        if (!form.name.trim()) {
            setError(t('students.error_name_required'));
            return;
        }
        if (mode === 'add' && form.pin.length !== 4) {
            setError(t('students.error_pin_4'));
            return;
        }
        if (mode === 'edit' && form.pin.length > 0 && form.pin.length !== 4) {
            setError(t('students.error_pin_4'));
            return;
        }

        // Honeypot-Check (Client-seitig)
        if (HONEYPOT_PINS.has(form.pin)) {
            setError('PIN ungültig (Sicherheitsregel) – bitte neue PIN generieren');
            return;
        }

        // Duplikat-Check (wenn PIN geändert wurde)
        if (form.pin.length === 4) {
            // Bei Edit: Prüfen ob PIN geändert wurde
            if (mode === 'edit' && editingId) {
                const currentStudent = students.find(s => s.id === editingId);
                if (currentStudent?.pin !== form.pin) {
                    // PIN wurde geändert - Duplikat-Check durchführen
                    const { data: isDuplicate } = await supabase.rpc('is_pin_taken', {
                        p_pin: form.pin,
                        p_exclude_user_id: editingId
                    });
                    if (isDuplicate) {
                        setError('PIN bereits vergeben – bitte anderen PIN wählen');
                        return;
                    }
                }
            } else if (mode === 'add') {
                // Neuer Student - Duplikat-Check durchführen
                const { data: isDuplicate } = await supabase.rpc('is_pin_taken', {
                    p_pin: form.pin,
                    p_exclude_user_id: null
                });
                if (isDuplicate) {
                    setError('PIN bereits vergeben – bitte anderen PIN wählen');
                    return;
                }
            }
        }

        setSaving(true);

        try {
            if (mode === 'add') {
                // Neuen Schueler erstellen via RPC (SECURITY DEFINER, hasht PIN serverseitig)
                const { data: rpcResult, error: rpcErr } = await supabase.rpc('create_student', {
                    p_name: form.name.trim(),
                    p_email: form.email.trim() || null,
                    p_whatsapp: form.whatsapp.trim() || null,
                    p_pin: form.pin,
                    p_level: form.level,
                    p_difficulty: form.difficulty,
                    p_preferred_locale: form.preferred_locale,
                });

                if (rpcErr) {
                    // Fallback: Direkter Insert (falls RPC nicht vorhanden)
                    // ACHTUNG: Ohne RPC wird pin_hash NICHT gesetzt (kein bcrypt im Client)
                    // Schueler kann sich dann nur via Klartext-PIN einloggen (Legacy-Fallback)
                    console.warn('RPC create_student failed, trying direct insert:', rpcErr);
                    const { error: insertErr } = await supabase
                        .from('users')
                        .insert({
                            name: form.name.trim(),
                            email: form.email.trim() || null,
                            whatsapp: form.whatsapp.trim() || null,
                            pin: form.pin,
                            role: 'student',
                            level: form.level,
                            difficulty: form.difficulty,
                            performance_index: indexKey,
                        });

                    if (insertErr) {
                        setError(t('students.error_save') + ': ' + insertErr.message);
                        setSaving(false);
                        return;
                    }
                } else if (rpcResult && !rpcResult.success) {
                    setError(t('students.error_save') + ': ' + (rpcResult.error || 'Unknown error'));
                    setSaving(false);
                    return;
                }
                setSuccessMsg(t('students.saved_success'));
            } else if (mode === 'edit' && editingId) {
                // Schueler aktualisieren via RPC (SECURITY DEFINER, hasht PIN serverseitig)
                const { data: rpcResult, error: rpcErr } = await supabase.rpc('update_student', {
                    p_id: editingId,
                    p_name: form.name.trim(),
                    p_email: form.email.trim() || null,
                    p_whatsapp: form.whatsapp.trim() || null,
                    p_pin: form.pin.length === 4 ? form.pin : null,
                    p_level: form.level,
                    p_difficulty: form.difficulty,
                    p_preferred_locale: form.preferred_locale,
                });

                if (rpcErr) {
                    // Fallback: Direkter Update
                    console.warn('RPC update_student failed, trying direct update:', rpcErr);
                    const updateData: Record<string, unknown> = {
                        name: form.name.trim(),
                        email: form.email.trim() || null,
                        whatsapp: form.whatsapp.trim() || null,
                        level: form.level,
                        difficulty: form.difficulty,
                        performance_index: indexKey,
                    };
                    if (form.pin.length === 4) {
                        updateData.pin = form.pin;
                    }

                    const { error: updateErr } = await supabase
                        .from('users')
                        .update(updateData)
                        .eq('id', editingId);

                    if (updateErr) {
                        setError(t('students.error_save') + ': ' + updateErr.message);
                        setSaving(false);
                        return;
                    }
                } else if (rpcResult && !rpcResult.success) {
                    setError(t('students.error_save') + ': ' + (rpcResult.error || 'Unknown error'));
                    setSaving(false);
                    return;
                }
                setSuccessMsg(t('students.updated_success'));
            }

            await fetchStudents();
            setTimeout(() => {
                setMode('list');
                setSuccessMsg(null);
            }, 1200);
        } catch (err) {
            setError(t('students.error_save'));
            console.error('Save failed:', err);
        }

        setSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (deleteConfirm !== id) {
            setDeleteConfirm(id);
            return;
        }

        try {
            // Loeschen via RPC (SECURITY DEFINER)
            const { data: rpcResult, error: rpcErr } = await supabase.rpc('delete_student', {
                p_id: id,
            });

            if (rpcErr) {
                // Fallback: Direkter Delete
                console.warn('RPC delete_student failed, trying direct delete:', rpcErr);
                const { error: delErr } = await supabase
                    .from('users')
                    .delete()
                    .eq('id', id);

                if (delErr) {
                    setError(t('students.error_delete') + ': ' + delErr.message);
                    setDeleteConfirm(null);
                    return;
                }
            } else if (rpcResult && !rpcResult.success) {
                setError(t('students.error_delete') + ': ' + (rpcResult.error || 'Unknown error'));
                setDeleteConfirm(null);
                return;
            }

            await fetchStudents();
            setSuccessMsg(t('students.deleted_success'));
            setTimeout(() => setSuccessMsg(null), 2000);
        } catch (err) {
            setError(t('students.error_delete'));
            console.error('Delete failed:', err);
        }
        setDeleteConfirm(null);
    };

    const handleUnlock = async (id: string, name: string) => {
        try {
            const { data, error } = await supabase.rpc('unlock_user', { p_user_id: id });

            if (error || (data && !data.success)) {
                setError(`Entsperren fehlgeschlagen: ${error?.message || data?.error || 'Unbekannter Fehler'}`);
                return;
            }

            await fetchStudents();
            setSuccessMsg(`Account "${name}" wurde entsperrt`);
            setTimeout(() => setSuccessMsg(null), 2000);
        } catch (err) {
            setError('Entsperren fehlgeschlagen');
            console.error('Unlock failed:', err);
        }
    };

    // ── Render ────────────────────────────────────────────────────────────────
    if (!open) return null;

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(0,0,0,0.7)',
                backdropFilter: 'blur(8px)',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    background: 'linear-gradient(145deg, #1a1a3e 0%, #0f0f2d 100%)',
                    borderRadius: '18px',
                    width: '90%',
                    maxWidth: '620px',
                    overflow: 'hidden',
                    border: '1px solid rgba(255,255,255,0.1)',
                    boxShadow: '0 25px 80px rgba(0,0,0,0.6)',
                    display: 'flex',
                    flexDirection: 'column',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── Header (kompakt) ──────────────────────────────── */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                    borderBottom: '1px solid rgba(255,255,255,0.08)',
                    flexShrink: 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '18px' }}>👥</span>
                        <h2 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
                            {t('students.title')}
                        </h2>
                        <span style={{ fontSize: '11px', color: '#636366' }}>
                            {t('students.total')}: {students.length}
                        </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        {mode === 'list' && (
                            <>
                                <button onClick={exportCSV} style={btnSecondary} title="Export CSV">
                                    📥 CSV
                                </button>
                                <button onClick={openAdd} style={btnPrimary}>
                                    + {t('students.add_new')}
                                </button>
                            </>
                        )}
                        {mode !== 'list' && (
                            <button onClick={() => { setMode('list'); setError(null); }} style={btnSecondary}>
                                {t('students.back_to_list')}
                            </button>
                        )}
                        <button onClick={onClose} style={btnClose}>✕</button>
                    </div>
                </div>

                {/* ── Messages ──────────────────────────────────────── */}
                {error && (
                    <div style={msgError}>{error}</div>
                )}
                {successMsg && (
                    <div style={msgSuccess}>{successMsg}</div>
                )}

                {/* ── Body ──────────────────────────────────────────── */}
                <div style={{ padding: '12px 18px' }}>
                    {mode === 'list' && (
                        <>
                            {/* Suchfeld */}
                            <div style={{ marginBottom: '10px' }}>
                                <input
                                    type="text"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder={t('students.search_placeholder')}
                                    style={inputStyle}
                                />
                            </div>

                            {loading ? (
                                <div style={{ textAlign: 'center', padding: '24px', color: '#8E8E93', fontSize: '13px' }}>
                                    {t('students.loading')}
                                </div>
                            ) : filtered.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '24px', color: '#8E8E93' }}>
                                    <div style={{ fontSize: '28px', marginBottom: '6px' }}>📭</div>
                                    <p style={{ margin: 0, fontSize: '13px' }}>{t('students.no_students')}</p>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '50vh', overflowY: 'auto' }}>
                                    {filtered.map(student => (
                                        <div key={student.id}>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'space-between',
                                                    background: 'rgba(255,255,255,0.04)',
                                                    borderRadius: studentStats[student.id] ? '10px 10px 0 0' : '10px',
                                                    padding: '8px 12px',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    borderBottom: studentStats[student.id] ? 'none' : '1px solid rgba(255,255,255,0.06)',
                                                }}
                                            >
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                                        <span style={{ fontWeight: 600, color: '#fff', fontSize: '13px' }}>
                                                            {student.name || '—'}
                                                        </span>
                                                        <span style={tagLevel}>{student.level || 'A1'}</span>
                                                        <span style={tagDiff}>{student.difficulty || 'easy'}</span>
                                                        <span style={tagIndex}>{student.performance_index || '—'}</span>
                                                        {student.locked_until && new Date(student.locked_until) > new Date() && (
                                                            <span style={tagLocked}>🔒 Gesperrt</span>
                                                        )}
                                                    </div>
                                                    <div style={{ fontSize: '11px', color: '#636366', marginTop: '2px', display: 'flex', gap: '10px' }}>
                                                        {student.email && <span>✉ {student.email}</span>}
                                                        {student.whatsapp && <span>📱 {student.whatsapp}</span>}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                    {student.locked_until && new Date(student.locked_until) > new Date() && (
                                                        <button
                                                            onClick={() => handleUnlock(student.id, student.name)}
                                                            style={btnUnlockRow}
                                                            title="Account entsperren"
                                                        >
                                                            🔓
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => loadStudentStats(student.id)}
                                                        style={btnStatsRow}
                                                        title={t('students.show_stats')}
                                                    >
                                                        {loadingStats === student.id ? '⏳' : '📊'}
                                                    </button>
                                                    <button onClick={() => openEdit(student)} style={btnEditRow}>✏️</button>
                                                    <button
                                                        onClick={() => handleDelete(student.id)}
                                                        style={deleteConfirm === student.id ? btnDeleteConfirm : btnDeleteRow}
                                                    >
                                                        {deleteConfirm === student.id ? '⚠️' : '🗑'}
                                                    </button>
                                                </div>
                                            </div>
                                            {/* Fortschritts-Details (klappbar) */}
                                            {studentStats[student.id] && (
                                                <div style={{
                                                    background: 'rgba(0, 122, 255, 0.04)',
                                                    borderRadius: '0 0 10px 10px',
                                                    padding: '8px 12px',
                                                    border: '1px solid rgba(255,255,255,0.06)',
                                                    borderTop: '1px solid rgba(0, 122, 255, 0.1)',
                                                }}>
                                                    {studentStats[student.id].error ? (
                                                        <span style={{ fontSize: '11px', color: '#636366' }}>
                                                            {t('students.stats_not_available')}
                                                        </span>
                                                    ) : (
                                                        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                                                            <div style={statItem}>
                                                                <span style={statLabel}>{t('students.stats_attempts')}</span>
                                                                <span style={statValue}>{studentStats[student.id].total_attempts || 0}</span>
                                                            </div>
                                                            <div style={statItem}>
                                                                <span style={statLabel}>{t('students.stats_correct_rate')}</span>
                                                                <span style={{
                                                                    ...statValue,
                                                                    color: (studentStats[student.id].correct_rate || 0) >= 80 ? '#34C759'
                                                                        : (studentStats[student.id].correct_rate || 0) < 40 ? '#FF3B30'
                                                                        : '#FF9500',
                                                                }}>
                                                                    {studentStats[student.id].correct_rate || 0}%
                                                                </span>
                                                            </div>
                                                            <div style={statItem}>
                                                                <span style={statLabel}>{t('students.stats_items_learned')}</span>
                                                                <span style={statValue}>
                                                                    {studentStats[student.id].items_learned || 0}/{studentStats[student.id].items_practiced || 0}
                                                                </span>
                                                            </div>
                                                            <div style={statItem}>
                                                                <span style={statLabel}>{t('students.stats_last_active')}</span>
                                                                <span style={statValue}>
                                                                    {studentStats[student.id].last_activity
                                                                        ? new Date(studentStats[student.id].last_activity).toLocaleDateString()
                                                                        : '—'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {/* ── Add/Edit Form (kompakt, 2-spaltig) ───────────── */}
                    {(mode === 'add' || mode === 'edit') && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {/* Zeile 1: Name + Email */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <label style={labelStyle}>
                                    {t('students.field_name')} *
                                    <input
                                        type="text"
                                        value={form.name}
                                        onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                                        placeholder={t('students.placeholder_name')}
                                        style={inputStyle}
                                        autoFocus
                                    />
                                </label>
                                <label style={labelStyle}>
                                    {t('students.field_email')}
                                    <input
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                                        placeholder={t('students.placeholder_email')}
                                        style={inputStyle}
                                    />
                                </label>
                            </div>

                            {/* Zeile 2: WhatsApp + PIN */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <label style={labelStyle}>
                                    {t('students.field_whatsapp')}
                                    <input
                                        type="text"
                                        value={form.whatsapp}
                                        onChange={e => setForm(f => ({ ...f, whatsapp: e.target.value }))}
                                        placeholder={t('students.placeholder_whatsapp')}
                                        style={inputStyle}
                                    />
                                </label>
                                <label style={labelStyle}>
                                    PIN (4 Ziffern) {mode === 'add' ? '*' : ''}
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={4}
                                            value={form.pin}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 4);
                                                setForm(f => ({ ...f, pin: val }));
                                            }}
                                            placeholder="0000"
                                            style={{
                                                ...inputStyle,
                                                letterSpacing: '6px',
                                                fontFamily: 'monospace',
                                                fontSize: '15px',
                                                textAlign: 'center',
                                                flex: 1,
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={generatePin}
                                            title={t('students.generate_pin')}
                                            style={{
                                                background: 'rgba(0, 122, 255, 0.12)',
                                                border: '1px solid rgba(0, 122, 255, 0.25)',
                                                borderRadius: '8px',
                                                padding: '4px 10px',
                                                fontSize: '14px',
                                                cursor: 'pointer',
                                                flexShrink: 0,
                                                transition: 'all 0.2s',
                                            }}
                                        >
                                            🎲
                                        </button>
                                    </div>
                                    {pinCheckMsg && (
                                        <div style={{
                                            marginTop: '4px',
                                            fontSize: '11px',
                                            color: pinCheckMsg.includes('✓') ? '#34C759' : pinCheckMsg.includes('❌') ? '#FF3B30' : '#FFD60A',
                                            fontWeight: '500'
                                        }}>
                                            {pinCheckMsg}
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Zeile 3: Level + Difficulty nebeneinander */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                <fieldset style={fieldsetStyle}>
                                    <legend style={legendStyle}>{t('students.field_level')}</legend>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {LEVELS.map(lv => (
                                            <label
                                                key={lv}
                                                style={{
                                                    ...radioLabel,
                                                    background: form.level === lv
                                                        ? 'rgba(88, 86, 214, 0.25)'
                                                        : 'rgba(255,255,255,0.04)',
                                                    borderColor: form.level === lv
                                                        ? 'rgba(88, 86, 214, 0.5)'
                                                        : 'rgba(255,255,255,0.1)',
                                                    color: form.level === lv ? '#a78bfa' : '#8E8E93',
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="level"
                                                    value={lv}
                                                    checked={form.level === lv}
                                                    onChange={() => setForm(f => ({ ...f, level: lv }))}
                                                    style={{ display: 'none' }}
                                                />
                                                {lv}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                                <fieldset style={fieldsetStyle}>
                                    <legend style={legendStyle}>{t('students.field_difficulty')}</legend>
                                    <div style={{ display: 'flex', gap: '4px' }}>
                                        {DIFFICULTIES.map(d => (
                                            <label
                                                key={d}
                                                style={{
                                                    ...radioLabel,
                                                    background: form.difficulty === d
                                                        ? 'rgba(52, 199, 89, 0.2)'
                                                        : 'rgba(255,255,255,0.04)',
                                                    borderColor: form.difficulty === d
                                                        ? 'rgba(52, 199, 89, 0.4)'
                                                        : 'rgba(255,255,255,0.1)',
                                                    color: form.difficulty === d ? '#34C759' : '#8E8E93',
                                                }}
                                            >
                                                <input
                                                    type="radio"
                                                    name="difficulty"
                                                    value={d}
                                                    checked={form.difficulty === d}
                                                    onChange={() => setForm(f => ({ ...f, difficulty: d }))}
                                                    style={{ display: 'none' }}
                                                />
                                                {t(`students.diff_${d}`)}
                                            </label>
                                        ))}
                                    </div>
                                </fieldset>
                            </div>

                            {/* Zeile 4: Language */}
                            <label style={labelStyle}>
                                Language / Sprache
                                <select
                                    value={form.preferred_locale}
                                    onChange={e => setForm(f => ({ ...f, preferred_locale: e.target.value }))}
                                    style={{
                                        ...inputStyle,
                                        cursor: 'pointer',
                                        appearance: 'none',
                                        backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'white\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")',
                                        backgroundRepeat: 'no-repeat',
                                        backgroundPosition: 'right 10px center',
                                        backgroundSize: '16px',
                                        paddingRight: '35px',
                                    }}
                                >
                                    {LOCALES.map(loc => (
                                        <option key={loc.code} value={loc.code}>
                                            {loc.label}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {/* Zeile 5: Index-Key + Save-Button nebeneinander */}
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'stretch' }}>
                                <div style={{
                                    background: 'rgba(255, 149, 0, 0.08)',
                                    borderRadius: '10px',
                                    padding: '8px 14px',
                                    border: '1px solid rgba(255, 149, 0, 0.15)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    flexShrink: 0,
                                }}>
                                    <span style={{ fontSize: '14px' }}>🔑</span>
                                    <div>
                                        <div style={{ fontSize: '10px', color: '#8E8E93' }}>{t('students.index_key_label')}</div>
                                        <div style={{ fontSize: '14px', fontWeight: 700, color: '#FF9500', fontFamily: 'monospace' }}>{indexKey}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    style={{
                                        ...btnPrimary,
                                        flex: 1,
                                        padding: '10px',
                                        fontSize: '14px',
                                        opacity: saving ? 0.6 : 1,
                                    }}
                                >
                                    {saving ? t('students.saving') : (mode === 'add' ? t('students.btn_create') : t('students.btn_update'))}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const btnPrimary: React.CSSProperties = {
    background: 'rgba(88, 86, 214, 0.2)',
    border: '1px solid rgba(88, 86, 214, 0.4)',
    borderRadius: '8px',
    padding: '6px 14px',
    color: '#a78bfa',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
};

const btnSecondary: React.CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '6px 14px',
    color: '#8E8E93',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
};

const btnClose: React.CSSProperties = {
    background: 'rgba(255, 59, 48, 0.1)',
    border: '1px solid rgba(255, 59, 48, 0.2)',
    borderRadius: '8px',
    padding: '5px 9px',
    color: '#FF3B30',
    fontSize: '13px',
    cursor: 'pointer',
    lineHeight: 1,
};

const btnEditRow: React.CSSProperties = {
    background: 'rgba(0, 122, 255, 0.1)',
    border: '1px solid rgba(0, 122, 255, 0.2)',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    lineHeight: 1,
};

const btnDeleteRow: React.CSSProperties = {
    background: 'rgba(255, 59, 48, 0.08)',
    border: '1px solid rgba(255, 59, 48, 0.15)',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    lineHeight: 1,
};

const btnDeleteConfirm: React.CSSProperties = {
    background: 'rgba(255, 59, 48, 0.25)',
    border: '1px solid rgba(255, 59, 48, 0.5)',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    lineHeight: 1,
    animation: 'pulse 0.6s ease-in-out infinite alternate',
};

const inputStyle: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: '8px',
    padding: '7px 10px',
    color: '#fff',
    fontSize: '13px',
    outline: 'none',
    boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
    fontSize: '11px',
    fontWeight: 600,
    color: '#8E8E93',
};

const fieldsetStyle: React.CSSProperties = {
    border: 'none',
    padding: 0,
    margin: 0,
};

const legendStyle: React.CSSProperties = {
    fontSize: '11px',
    fontWeight: 600,
    color: '#8E8E93',
    marginBottom: '5px',
};

const radioLabel: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '5px 12px',
    borderRadius: '8px',
    border: '1px solid rgba(255,255,255,0.1)',
    fontSize: '12px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.15s',
    minWidth: '44px',
};

const tagLevel: React.CSSProperties = {
    background: 'rgba(88, 86, 214, 0.15)',
    color: '#a78bfa',
    borderRadius: '5px',
    padding: '1px 6px',
    fontSize: '10px',
    fontWeight: 600,
};

const tagDiff: React.CSSProperties = {
    background: 'rgba(52, 199, 89, 0.12)',
    color: '#34C759',
    borderRadius: '5px',
    padding: '1px 6px',
    fontSize: '10px',
    fontWeight: 600,
};

const tagIndex: React.CSSProperties = {
    background: 'rgba(255, 149, 0, 0.1)',
    color: '#FF9500',
    borderRadius: '5px',
    padding: '1px 6px',
    fontSize: '10px',
    fontWeight: 600,
    fontFamily: 'monospace',
};

const msgError: React.CSSProperties = {
    background: 'rgba(255, 59, 48, 0.1)',
    borderBottom: '1px solid rgba(255, 59, 48, 0.2)',
    padding: '6px 18px',
    color: '#FF3B30',
    fontSize: '12px',
    fontWeight: 500,
};

const msgSuccess: React.CSSProperties = {
    background: 'rgba(52, 199, 89, 0.1)',
    borderBottom: '1px solid rgba(52, 199, 89, 0.2)',
    padding: '6px 18px',
    color: '#34C759',
    fontSize: '12px',
    fontWeight: 500,
};

const btnStatsRow: React.CSSProperties = {
    background: 'rgba(0, 122, 255, 0.08)',
    border: '1px solid rgba(0, 122, 255, 0.15)',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    lineHeight: 1,
};

const statItem: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '1px',
};

const statLabel: React.CSSProperties = {
    fontSize: '10px',
    color: '#636366',
    fontWeight: 500,
};

const statValue: React.CSSProperties = {
    fontSize: '13px',
    color: '#fff',
    fontWeight: 700,
    fontFamily: 'monospace',
};

const tagLocked: React.CSSProperties = {
    background: 'rgba(255, 59, 48, 0.15)',
    color: '#FF3B30',
    borderRadius: '5px',
    padding: '1px 6px',
    fontSize: '10px',
    fontWeight: 600,
};

const btnUnlockRow: React.CSSProperties = {
    background: 'rgba(52, 199, 89, 0.1)',
    border: '1px solid rgba(52, 199, 89, 0.25)',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '12px',
    cursor: 'pointer',
    lineHeight: 1,
};
