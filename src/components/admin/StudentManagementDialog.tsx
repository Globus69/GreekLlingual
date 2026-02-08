"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/db/supabase';
import { useTranslation } from '@/lib/useTranslation';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Student {
    id: string;
    name: string;
    email: string;
    whatsapp: string;
    role: string;
    level: string;
    difficulty: string;
    performance_index: string;
}

interface StudentFormData {
    name: string;
    email: string;
    whatsapp: string;
    pin: string;
    level: string;
    difficulty: string;
}

interface Props {
    open: boolean;
    onClose: () => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const LEVELS = ['A1', 'A2', 'B1', 'B2'];
const DIFFICULTIES = ['easy', 'middle', 'hard'];

const EMPTY_FORM: StudentFormData = {
    name: '',
    email: '',
    whatsapp: '',
    pin: '',
    level: 'A1',
    difficulty: 'easy',
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

    // ── Computed ──────────────────────────────────────────────────────────────
    const indexKey = `${form.level}-${form.difficulty}`;

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
                    .select('id, name, email, whatsapp, role, level, difficulty, performance_index')
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
    const openAdd = () => {
        setForm(EMPTY_FORM);
        setEditingId(null);
        setMode('add');
        setError(null);
        setSuccessMsg(null);
    };

    const openEdit = (student: Student) => {
        setForm({
            name: student.name || '',
            email: student.email || '',
            whatsapp: student.whatsapp || '',
            pin: '', // PIN nie anzeigen, nur neu setzen
            level: student.level || 'A1',
            difficulty: student.difficulty || 'easy',
        });
        setEditingId(student.id);
        setMode('edit');
        setError(null);
        setSuccessMsg(null);
    };

    const handleSave = async () => {
        setError(null);
        setSuccessMsg(null);

        // Validierung
        if (!form.name.trim()) {
            setError(t('students.error_name_required'));
            return;
        }
        if (mode === 'add' && form.pin.length !== 6) {
            setError(t('students.error_pin_6'));
            return;
        }
        if (mode === 'edit' && form.pin.length > 0 && form.pin.length !== 6) {
            setError(t('students.error_pin_6'));
            return;
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
                    p_pin: form.pin.length === 6 ? form.pin : null,
                    p_level: form.level,
                    p_difficulty: form.difficulty,
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
                    if (form.pin.length === 6) {
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
                            <button onClick={openAdd} style={btnPrimary}>
                                + {t('students.add_new')}
                            </button>
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
                                        <div
                                            key={student.id}
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                background: 'rgba(255,255,255,0.04)',
                                                borderRadius: '10px',
                                                padding: '8px 12px',
                                                border: '1px solid rgba(255,255,255,0.06)',
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
                                                </div>
                                                <div style={{ fontSize: '11px', color: '#636366', marginTop: '2px', display: 'flex', gap: '10px' }}>
                                                    {student.email && <span>✉ {student.email}</span>}
                                                    {student.whatsapp && <span>📱 {student.whatsapp}</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                                                <button onClick={() => openEdit(student)} style={btnEditRow}>✏️</button>
                                                <button
                                                    onClick={() => handleDelete(student.id)}
                                                    style={deleteConfirm === student.id ? btnDeleteConfirm : btnDeleteRow}
                                                >
                                                    {deleteConfirm === student.id ? '⚠️' : '🗑'}
                                                </button>
                                            </div>
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
                                    {t('students.field_pin')} {mode === 'add' ? '*' : `(${t('students.pin_optional')})`}
                                    <input
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        value={form.pin}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                            setForm(f => ({ ...f, pin: val }));
                                        }}
                                        placeholder="000000"
                                        style={{
                                            ...inputStyle,
                                            letterSpacing: '6px',
                                            fontFamily: 'monospace',
                                            fontSize: '15px',
                                            textAlign: 'center',
                                        }}
                                    />
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

                            {/* Zeile 4: Index-Key + Save-Button nebeneinander */}
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
