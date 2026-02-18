# Vocabulary Management UI Components - Implementation Guide

**Project:** HellenicHorizons GreekLingua Dashboard
**Module:** Multilingual Vocabulary Management (Admin Desktop)
**Date:** February 18, 2026
**Status:** Backend Complete, UI Pending

---

## 📦 WHAT'S BEEN COMPLETED

### ✅ Backend Layer (100% Complete)

1. **Database Schema** (`078_create_multilingual_vocabulary.sql`)
   - `multilingual_vocabulary` table with 4 languages
   - Full-text search indexes
   - RLS policies (admin full access, students read-only)
   - 5 RPC functions (filtering, stats, bulk operations)

2. **TypeScript Types** (`src/types/vocabulary.ts`)
   - Complete type definitions
   - Validation helpers
   - Color constants
   - Utility functions

3. **API Integration** (`src/lib/api/vocab.ts`)
   - 11 API functions (CRUD, bulk, import/export)
   - Papa Parse integration for CSV
   - Full error handling

4. **Statistics Component** (`src/components/admin/VocabStats.tsx`)
   - Overview cards
   - Level/difficulty distribution charts
   - Audio coverage visualization

---

## 🎯 WHAT NEEDS TO BE BUILT

### Priority 1: Core UI Components

#### 1. Main Vocabulary Page
**File:** `src/app/admin/vocab/page.tsx`
**Estimated Time:** 2 hours
**Dependencies:** VocabTable, VocabModal, VocabStats

**Structure:**
```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import VocabStats from '@/components/admin/VocabStats';
import VocabTable from '@/components/admin/VocabTable';
import VocabModal from '@/components/admin/VocabModal';
import VocabImportModal from '@/components/admin/VocabImportModal';
import VocabBulkEditModal from '@/components/admin/VocabBulkEditModal';
import { fetchVocabList, exportCSV } from '@/lib/api/vocab';
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
        loadEntries();
    }, [filters, page]);

    const loadEntries = async () => {
        try {
            setLoading(true);
            const response = await fetchVocabList({ ...filters, page });
            setEntries(response.data);
            setTotal(response.total);
        } catch (error) {
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
            toast.error('Export failed');
        }
    };

    if (authLoading || (!authLoading && !isAdmin)) {
        return <div>Loading...</div>;
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
            }}>
                <div>
                    <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
                        📚 Vocabulary Management
                    </h1>
                    <p style={{ fontSize: '14px', color: '#8E8E93' }}>
                        {total} entries • Multilingual (EN, DE, ES, RU)
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
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
                        <button onClick={() => setShowBulkEditModal(true)} style={secondaryButtonStyle}>
                            Bulk Edit ({selectedIds.length})
                        </button>
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
                        onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                        style={inputStyle}
                    />
                    <select
                        value={filters.level || 'All'}
                        onChange={(e) => setFilters({ ...filters, level: e.target.value as any, page: 1 })}
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
                        onChange={(e) => setFilters({ ...filters, difficulty: e.target.value as any, page: 1 })}
                        style={inputStyle}
                    >
                        <option value="All">All Difficulties</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <button
                        onClick={() => setFilters({})}
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
                onDelete={async (id) => {
                    if (confirm('Delete this entry?')) {
                        await deleteVocabEntry(id);
                        toast.success('Deleted');
                        loadEntries();
                    }
                }}
                onRefresh={loadEntries}
            />

            {/* Pagination */}
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '12px',
                marginTop: '24px',
            }}>
                <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    style={secondaryButtonStyle}
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
                    style={secondaryButtonStyle}
                >
                    Next
                </button>
            </div>

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
};

const inputStyle: React.CSSProperties = {
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: '14px',
};
```

---

#### 2. Vocabulary Table Component
**File:** `src/components/admin/VocabTable.tsx`
**Estimated Time:** 2 hours

**Key Features:**
- Checkbox column for multi-select
- Sortable columns
- Level/difficulty badges with color coding
- Frequency stars (★★★☆☆)
- Audio indicators (🔊/🔇)
- Edit/Delete actions
- Loading skeleton
- Empty state

**Column Structure:**
1. Checkbox
2. Nr
3. Greek (bold)
4. Phonetic (gray)
5. EN Translation
6. DE Translation
7. ES Translation
8. RU Translation
9. Level (badge)
10. Difficulty (badge)
11. Frequency (stars)
12. Audio (icons for all 4 languages)
13. Actions (Edit, Delete)

**Implementation Tips:**
- Use `<table>` with styled rows
- Add hover effect on rows
- Use tooltips for importance reasons
- Add keyboard shortcuts (Delete key, etc.)
- Implement "Select All" checkbox

---

#### 3. Vocabulary Modal Component
**File:** `src/components/admin/VocabModal.tsx`
**Estimated Time:** 2.5 hours

**Structure:**
```
Modal Header
  - Title: "Create Entry" or "Edit Entry"
  - Close button

Scrollable Content
  - Core Fields Section
    - Nr (optional number)
    - Greek Transcription* (required, max 200)
    - Greek Phonetic (optional)
    - Level* (dropdown A1-C2)
    - Difficulty* (dropdown easy/medium/hard)
    - Frequency* (1-5 slider or input)

  - Language Sections (Accordion/Collapsible)
    - English Section
      - Translation (textarea)
      - Importance Reason (textarea)
      - Audio URL (text input with 🔗 icon)
    - German Section (same structure)
    - Spanish Section (same structure)
    - Russian Section (same structure)

Sticky Footer
  - Cancel button (gray)
  - Save button (blue, disabled while saving)
```

**Validation:**
- Required fields marked with *
- Real-time character counter
- Duplicate warning (if greek + level exists)
- Show validation errors inline
- Disable save if validation fails

---

#### 4. Bulk Edit Modal
**File:** `src/components/admin/VocabBulkEditModal.tsx`
**Estimated Time:** 1 hour

**Simple Structure:**
```
Header: "Editing X entries"

Form Fields (all optional):
  - Level dropdown (or leave unchanged)
  - Difficulty dropdown (or leave unchanged)
  - Frequency input (or leave unchanged)

Footer:
  - Cancel
  - Save (only updates fields that are set)
```

---

#### 5. CSV Import Modal
**File:** `src/components/admin/VocabImportModal.tsx`
**Estimated Time:** 2 hours

**Features:**
- Download template button (top right)
- File upload area (drag & drop)
- Mode selector:
  - Radio: Append (add new)
  - Radio: Overwrite (delete all first) with warning
- Preview section:
  - Shows first 10 rows
  - Color-coded (green = valid, red = invalid)
  - Shows validation errors per row
- Import button (bottom)
- Progress bar (during import)
- Results summary:
  - X imported
  - Y skipped
  - Error list (expandable)

---

### Priority 2: Navigation Update

**File:** `src/app/admin/page.tsx`
**Estimated Time:** 15 minutes

Add this card after Daily Phrases card:

```tsx
<div style={{
    background: 'rgba(65, 105, 225, 0.08)', // Blue gradient
    borderRadius: '20px',
    padding: '32px',
    border: '1px solid rgba(65, 105, 225, 0.15)',
    cursor: 'pointer',
    transition: 'all 0.2s',
}}
    onClick={() => router.push('/admin/vocab')}
    onMouseEnter={(e) => {
        e.currentTarget.style.background = 'rgba(65, 105, 225, 0.15)';
        e.currentTarget.style.transform = 'translateY(-2px)';
    }}
    onMouseLeave={(e) => {
        e.currentTarget.style.background = 'rgba(65, 105, 225, 0.08)';
        e.currentTarget.style.transform = 'translateY(0)';
    }}
>
    <div style={{ fontSize: '40px', marginBottom: '12px' }}>📚</div>
    <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>
        Vocabulary Management
    </h3>
    <p style={{ fontSize: '13px', color: '#8E8E93' }}>
        Manage multilingual vocabulary • Import/Export CSV
    </p>
</div>
```

---

## 🎨 DESIGN SYSTEM

### Colors
- Background: `#0F0F11`
- Card background: `rgba(255,255,255,0.04)`
- Card border: `rgba(255,255,255,0.08)`
- Primary (blue): `#007AFF`
- Success (green): `#34C759`
- Warning (yellow): `#FFD60A`
- Error (red): `#FF3B30`

### Level Colors
- A1: `#34C759` (green)
- A2: `#30D158` (light green)
- B1: `#64D2FF` (light blue)
- B2: `#0A84FF` (blue)
- C1: `#BF5AF2` (purple)
- C2: `#AF52DE` (dark purple)

### Difficulty Colors
- Easy: `#34C759` (green)
- Medium: `#FFD60A` (yellow)
- Hard: `#FF3B30` (red)

### Typography
- Title: 32px, 700
- Subtitle: 18px, 700
- Body: 14px, 400
- Small: 13px, 400
- Tiny: 11px, 600

### Spacing
- Section gap: 24px
- Card padding: 20-32px
- Button padding: 12px 20px
- Input padding: 12px
- Border radius: 12-16px

---

## 📚 REFERENCE EXAMPLES

### Similar Components to Study

1. **Daily Phrases Table** (`src/components/admin/DailyPhrasesTable.tsx`)
   - Table structure
   - Sorting logic
   - Pagination

2. **Daily Phrases Modal** (`src/components/admin/DailyPhrasesModal.tsx`)
   - Form layout
   - Validation
   - Save logic

3. **Import Preview** (`src/components/admin/ImportPreview.tsx`)
   - CSV preview UI
   - Validation display
   - Error handling

4. **Content Table** (`src/components/admin/ContentTable.tsx`)
   - Multi-select checkboxes
   - Bulk operations

---

## ✅ TESTING CHECKLIST

### Before Deployment:
- [ ] Run database migration
- [ ] Verify all RPC functions work
- [ ] Test create entry
- [ ] Test edit entry
- [ ] Test delete entry
- [ ] Test bulk edit
- [ ] Test bulk delete
- [ ] Test CSV import (append)
- [ ] Test CSV import (overwrite)
- [ ] Test CSV export
- [ ] Test template download
- [ ] Test filters (search, level, difficulty)
- [ ] Test pagination
- [ ] Test sorting
- [ ] Verify admin-only access
- [ ] Check duplicate detection
- [ ] Verify toast notifications
- [ ] Test loading states
- [ ] Test empty states
- [ ] Check mobile responsiveness (basic)

---

## 🚀 DEPLOYMENT STEPS

1. **Database Setup:**
   ```sql
   -- Run in Supabase SQL Editor:
   -- Copy contents of: supabase/migrations/078_create_multilingual_vocabulary.sql
   ```

2. **Verify Migration:**
   ```sql
   SELECT * FROM multilingual_vocabulary LIMIT 1;
   SELECT get_vocabulary_stats();
   ```

3. **Test Import:**
   - Download template from UI
   - Fill in 2-3 test entries
   - Import in append mode
   - Verify entries appear

4. **Production Deployment:**
   - Merge branch to main
   - Deploy via Vercel/hosting platform
   - Monitor error logs
   - Gather user feedback

---

## 📞 NEED HELP?

### Quick Fixes for Common Issues:

**Table Not Showing Data:**
- Check RLS policies (admin role check)
- Verify Supabase client initialization
- Check browser console for errors
- Test API function directly

**Import Failing:**
- Verify CSV format matches template
- Check for special characters in Greek text
- Ensure level/difficulty values are valid
- Check browser console for Papa Parse errors

**Duplicate Errors:**
- Check unique constraint (greek_transcription + level)
- Update entry instead of creating new
- Use different level if same word

**Styling Issues:**
- Ensure all inline styles are objects
- Check for missing closing braces
- Verify color values are strings
- Test in different browsers

---

**END OF IMPLEMENTATION GUIDE**

For questions or clarifications, refer to:
- `_Agent8_Admin_Desktop.md` - Session log
- `src/types/vocabulary.ts` - Type definitions
- `src/lib/api/vocab.ts` - API functions
- Agent 2 & 3 documentation for similar patterns
