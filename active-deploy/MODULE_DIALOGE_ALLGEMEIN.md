# MODULE_DIALOGE_ALLGEMEIN.md
**Version:** 1.0
**Letzte Aktualisierung:** 2026-02-14
**Zweck:** Allgemeine Vorlage und Richtlinien für alle Dialog-Module

---

## 📋 INHALTSVERZEICHNIS

1. [Überblick](#überblick)
2. [Modul-Struktur](#modul-struktur)
3. [UI/UX-Richtlinien](#uiux-richtlinien)
4. [Technische Anforderungen](#technische-anforderungen)
5. [SRS-Integration](#srs-integration)
6. [Supabase-Anbindung](#supabase-anbindung)
7. [Multi-Language Support](#multi-language-support)
8. [Desktop/Mobile Konsistenz](#desktopmobile-konsistenz)
9. [Testing & Qualitätssicherung](#testing--qualitätssicherung)
10. [Checkliste für neue Module](#checkliste-für-neue-module)

---

## 🎯 ÜBERBLICK

### **Was ist ein Dialog-Modul?**

Ein Dialog-Modul ist eine wiederverwendbare, modal-basierte Komponente für Lernaktivitäten im GreekLingua Dashboard. Es zeigt Lerninhalte (Vokabeln, Grammatik, Phrasen, etc.) in einem interaktiven Format und trackt den Lernfortschritt mit Spaced Repetition (SRS).

### **Beispiele existierender Module:**
- ✅ **VocabularyDialog** - Vokabel-Training mit 3 Modi (weak/due/review)
- ✅ **GrammarDialog** - Grammatik-Übungen
- ✅ **ComprehensionDialog** - Leseverständnis
- ✅ **ListeningDialog** - Hörverständnis mit Audio
- ✅ **LessonDialog** - Lehrer-geführte Sessions (Read-Only)

### **Zielgruppe:**
- **Entwickler:** Die ein neues Lernmodul erstellen
- **KI-Assistenz:** Claude/Grok bei der Implementierung
- **Maintainer:** Zur Konsistenz-Prüfung

---

## 📂 MODUL-STRUKTUR

### **1. Verzeichnis-Layout**

```
/modules/{modul-name}/
├── README.md                  # Modul-Dokumentation
├── todo.md                    # Modul-spezifische TODOs
├── {modul-name}.tsx           # Haupt-Dialog-Komponente
├── {modul-name}.types.ts      # TypeScript-Interfaces
├── {modul-name}.utils.ts      # Helper-Funktionen
├── {modul-name}.test.tsx      # Unit-Tests (optional)
└── sql/
    ├── create-tables.sql      # Supabase-Tabellen
    ├── create-rpc.sql         # RPC-Funktionen
    └── seed-data.sql          # Test-Daten (optional)
```

**Beispiel: Due Cards Today Modul**
```
/modules/due-cards-today/
├── README.md
├── todo.md
├── DueCardsDialog.tsx
├── DueCardsDialog.types.ts
├── useDueCards.ts             # Custom Hook
└── sql/
    └── get-due-cards-rpc.sql
```

---

### **2. Haupt-Komponente Struktur**

```tsx
// {modul-name}/ModulDialog.tsx

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { useTranslation } from '@/lib/useTranslation';
import { supabase } from '@/lib/supabaseClient';

// ===== INTERFACES =====
interface ModulItem {
  id: number;
  type: string;
  english: string;
  russian?: string;
  greek: string;
  level?: 'A1' | 'A2' | 'B1' | 'B2';
  difficulty?: 'easy' | 'middle' | 'hard';
  // SRS-Daten (aus student_progress LEFT JOIN)
  ease_factor?: number;
  interval_days?: number;
  next_review?: string;
  attempts?: number;
  correct_count?: number;
}

interface ModulDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'weak' | 'due' | 'review';  // Optional: Verschiedene Modi
}

// ===== KOMPONENTE =====
export default function ModulDialog({ isOpen, onClose, mode = 'review' }: ModulDialogProps) {
  const { user, isAuthenticated } = useAuth();
  const { locale } = useLanguage();
  const { t } = useTranslation();

  // ===== STATE =====
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<ModulItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
  const [isComplete, setIsComplete] = useState(false);

  // ===== DATA FETCHING =====
  const fetchItems = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Strategy 1: RPC-Funktion (bevorzugt)
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_items_for_module', {
        p_student_id: user.id,
        p_type: 'modul-type',
        p_mode: mode,
        p_limit: 10
      });

      if (rpcData && !rpcError) {
        setItems(rpcData);
        return;
      }

      // Strategy 2: Direkte Query (Fallback)
      const { data: directData, error: directError } = await supabase
        .from('learning_items')
        .select('*')
        .eq('type', 'modul-type')
        .limit(10);

      if (directData && !directError) {
        setItems(directData);
        return;
      }

      // Strategy 3: Hardcoded Fallback
      setItems(FALLBACK_ITEMS);
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems(FALLBACK_ITEMS);
    } finally {
      setLoading(false);
    }
  }, [user, mode]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      fetchItems();
    }
  }, [isOpen, isAuthenticated, fetchItems]);

  // ===== HANDLERS =====
  const handleScore = async (quality: number) => {
    // SRS-Logik: Siehe Abschnitt "SRS-Integration"
    // ...
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setSessionStats({ correct: 0, wrong: 0 });
    setIsComplete(false);
    fetchItems();
  };

  // ===== RENDERING =====
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 overflow-hidden">

        {/* HEADER */}
        <div className="relative px-6 py-5 border-b border-white/10 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <h2 className="text-2xl font-bold text-white">
            {t('modul.title')}
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            {t('modul.subtitle')}
          </p>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* CONTENT */}
        <div className="p-6 min-h-[400px]">
          {loading && (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4" />
              <p className="text-white/70">{t('modul.loading')}</p>
            </div>
          )}

          {!loading && !isAuthenticated && (
            <div className="text-center py-12">
              <p className="text-white/70">{t('modul.login_required')}</p>
            </div>
          )}

          {!loading && isAuthenticated && items.length === 0 && (
            <div className="text-center py-12">
              <p className="text-white/70">{t('modul.no_items')}</p>
            </div>
          )}

          {!loading && isAuthenticated && items.length > 0 && !isComplete && (
            // MAIN CONTENT (Flashcard, Quiz, etc.)
            <div>
              {/* Modul-spezifisches UI */}
              <p className="text-white">Item {currentIndex + 1} von {items.length}</p>
            </div>
          )}

          {isComplete && (
            // SUMMARY
            <div className="text-center py-12">
              <h3 className="text-2xl font-bold text-white mb-4">
                {t('modul.session_complete')}
              </h3>
              <p className="text-green-400 text-xl">
                ✓ {sessionStats.correct} {t('shared.correct')}
              </p>
              <p className="text-red-400 text-xl">
                ✗ {sessionStats.wrong} {t('shared.wrong')}
              </p>
              <button onClick={handleRestart} className="mt-6 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                {t('btn.restart')}
              </button>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t border-white/10 bg-white/5 flex justify-between">
          <button onClick={onClose} className="px-4 py-2 text-white/70 hover:text-white transition-colors">
            {t('btn.cancel')}
          </button>
          <div className="text-white/50 text-sm">
            {currentIndex + 1} / {items.length}
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== FALLBACK DATA =====
const FALLBACK_ITEMS: ModulItem[] = [
  {
    id: 1,
    type: 'modul-type',
    english: 'Hello',
    russian: 'Привет',
    greek: 'Γεια σου',
    level: 'A1',
    difficulty: 'easy'
  },
  // ... mehr Fallback-Items
];
```

---

## 🎨 UI/UX-RICHTLINIEN

### **1. Glasmorphismus-Design** (Konsistent mit Desktop)

```tsx
// Container
className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10"

// Header
className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-white/10"

// Cards
className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4"

// Buttons (Primary)
className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105"

// Buttons (Secondary)
className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg transition-colors"
```

---

### **2. Touch-Optimierung** (Mobile-First)

```tsx
// Minimale Touch-Target-Größe: 44x44px (Apple HIG)
<button className="min-w-[44px] min-h-[44px] p-3">
  Button
</button>

// Swipe-Gesten (optional, für Flashcards)
import { useSwipeable } from 'react-swipeable';

const handlers = useSwipeable({
  onSwipedLeft: () => handleScore(1),  // Hard
  onSwipedRight: () => handleScore(3), // Easy
  onSwipedUp: () => handleScore(2),    // Good
  preventScrollOnSwipe: true,
  trackMouse: true
});

<div {...handlers} className="swipeable-card">
  {/* Card Content */}
</div>
```

---

### **3. Responsive Breakpoints**

```tsx
// Tailwind Breakpoints
// sm:  640px  (Small Mobile)
// md:  768px  (Tablet)
// lg:  1024px (Desktop)

// Beispiel: Conditional Layout
<div className="
  grid grid-cols-1        /* Mobile: 1 Spalte */
  md:grid-cols-2          /* Tablet: 2 Spalten */
  lg:grid-cols-3          /* Desktop: 3 Spalten */
  gap-4
">
  {/* Content */}
</div>
```

---

### **4. Loading-States**

```tsx
// Spinner
<div className="flex flex-col items-center justify-center h-64">
  <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent mb-4" />
  <p className="text-white/70">{t('modul.loading')}</p>
  <p className="text-white/50 text-sm mt-2">{t('modul.loading_subtitle')}</p>
</div>

// Skeleton (alternativ)
<div className="animate-pulse space-y-4">
  <div className="h-4 bg-white/10 rounded w-3/4"></div>
  <div className="h-4 bg-white/10 rounded w-1/2"></div>
</div>
```

---

### **5. Error-Handling**

```tsx
// Fehler-Anzeige
{error && (
  <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 mb-4">
    <p className="text-red-400 font-semibold">{t('modul.error')}</p>
    <p className="text-red-300 text-sm mt-1">{error}</p>
  </div>
)}

// Retry-Button
<button
  onClick={fetchItems}
  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
>
  {t('btn.retry')}
</button>
```

---

## 🔧 TECHNISCHE ANFORDERUNGEN

### **1. TypeScript-Interfaces** (Pflicht)

```typescript
// {modul-name}.types.ts

/**
 * Base interface für alle Lernitem-Typen
 * Erweitert um modul-spezifische Felder
 */
export interface LearningItem {
  id: number;
  type: string;
  english: string;
  russian?: string;
  greek: string;
  example_en?: string;
  example_gr?: string;
  audio_url?: string;
  level?: 'A1' | 'A2' | 'B1' | 'B2';
  difficulty?: 'easy' | 'middle' | 'hard';
}

/**
 * SRS Progress-Daten (aus student_progress Tabelle)
 */
export interface SRSProgress {
  ease_factor: number;      // SM2 Ease Factor (1.3 - 2.5+)
  interval_days: number;    // Intervall bis nächster Review
  next_review: string;      // ISO 8601 Datum
  attempts: number;         // Anzahl Versuche
  correct_count: number;    // Anzahl richtige Antworten
  last_attempt?: string;    // Letzter Versuch (ISO 8601)
}

/**
 * Kombiniertes Item mit SRS-Daten
 */
export interface LearningItemWithProgress extends LearningItem {
  // SRS-Daten (optional, aus LEFT JOIN)
  ease_factor?: number;
  interval_days?: number;
  next_review?: string;
  attempts?: number;
  correct_count?: number;
}

/**
 * Modul-Dialog Props
 */
export interface ModulDialogProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: 'weak' | 'due' | 'review';
  initialItems?: LearningItemWithProgress[];
}

/**
 * Session-Statistiken
 */
export interface SessionStats {
  correct: number;
  wrong: number;
  total: number;
  duration_seconds?: number;
  completed_at?: string;
}
```

---

### **2. Custom Hooks** (Empfohlen)

```typescript
// {modul-name}/useModulData.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import type { LearningItemWithProgress } from './types';

export function useModulData(mode: 'weak' | 'due' | 'review', limit: number = 10) {
  const { user } = useAuth();
  const [items, setItems] = useState<LearningItemWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // RPC-Strategie (bevorzugt)
      const { data, error: rpcError } = await supabase.rpc('get_items_for_module', {
        p_student_id: user.id,
        p_type: 'modul-type',
        p_mode: mode,
        p_limit: limit
      });

      if (rpcError) throw rpcError;
      setItems(data || []);
    } catch (err) {
      console.error('Error fetching items:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
      setItems(FALLBACK_ITEMS);
    } finally {
      setLoading(false);
    }
  }, [user, mode, limit]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, error, refetch: fetchItems };
}
```

---

### **3. Fehlerbehandlung** (3-Stufen-Strategie)

```typescript
// Priority 1: RPC-Funktion (sicherste, filtered)
const { data: rpcData, error: rpcError } = await supabase.rpc('get_items', {...});

if (rpcData && !rpcError) {
  return rpcData;
}

// Priority 2: Direkte Query (Fallback)
const { data: directData, error: directError } = await supabase
  .from('learning_items')
  .select('*')
  .eq('type', 'vocabulary')
  .limit(10);

if (directData && !directError) {
  return directData;
}

// Priority 3: Hardcoded Fallback (offline-fähig)
return FALLBACK_ITEMS;
```

---

## 🔄 SRS-INTEGRATION

### **1. SM2-Algorithm** (Spaced Repetition)

```typescript
// lib/sm2.ts (bereits vorhanden, wiederverwendbar)

export interface SM2Result {
  ease_factor: number;
  interval_days: number;
  repetition: number;
}

/**
 * SM2-Algorithm für Spaced Repetition
 * @param quality - Rating: 0 (total blackout) - 5 (perfect response)
 * @param current - Aktueller SRS-Status
 */
export function calculateSM2(quality: number, current: SRSProgress): SM2Result {
  let { ease_factor, interval_days, repetition = 0 } = current;

  // Incorrect response (quality < 3)
  if (quality < 3) {
    repetition = 0;
    interval_days = 1;
  } else {
    // Correct response
    if (repetition === 0) {
      interval_days = 1;
    } else if (repetition === 1) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    repetition += 1;
  }

  // Update ease factor
  ease_factor = ease_factor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  ease_factor = Math.max(1.3, ease_factor); // Min EF = 1.3

  return { ease_factor, interval_days, repetition };
}
```

---

### **2. Rating-Buttons** (UI → Quality Mapping)

```tsx
// Rating-Buttons (Hard/Good/Easy)
const RATING_CONFIG = {
  hard: { quality: 3, label: 'btn.hard', color: 'red', rating: 1.0 },
  good: { quality: 4, label: 'btn.good', color: 'yellow', rating: 2.5 },
  easy: { quality: 5, label: 'btn.easy', color: 'green', rating: 3.0 }
} as const;

// Handler
const handleScore = async (rating: 'hard' | 'good' | 'easy') => {
  const config = RATING_CONFIG[rating];
  const currentItem = items[currentIndex];

  // SM2-Berechnung
  const sm2Result = calculateSM2(config.quality, {
    ease_factor: currentItem.ease_factor || 2.5,
    interval_days: currentItem.interval_days || 0,
    repetition: currentItem.attempts || 0
  });

  // Supabase speichern
  await saveProgress(currentItem.id, sm2Result, config.quality >= 4);

  // Statistik aktualisieren
  setSessionStats(prev => ({
    correct: prev.correct + (config.quality >= 4 ? 1 : 0),
    wrong: prev.wrong + (config.quality < 4 ? 1 : 0)
  }));

  // Nächstes Item
  handleNext();
};
```

---

### **3. Progress speichern** (Supabase)

```typescript
// Speichert SRS-Progress in student_progress Tabelle
async function saveProgress(itemId: number, sm2: SM2Result, isCorrect: boolean) {
  if (!user) return;

  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + sm2.interval_days);

  const { error } = await supabase
    .from('student_progress')
    .upsert({
      student_id: user.id,
      item_id: itemId,
      ease_factor: sm2.ease_factor,
      interval_days: sm2.interval_days,
      next_review: nextReviewDate.toISOString(),
      attempts: (currentItem.attempts || 0) + 1,
      correct_count: (currentItem.correct_count || 0) + (isCorrect ? 1 : 0),
      last_attempt: new Date().toISOString()
    }, {
      onConflict: 'student_id,item_id'
    });

  if (error) {
    console.error('Error saving progress:', error);
  }
}
```

---

## 🗄️ SUPABASE-ANBINDUNG

### **1. RPC-Funktionen** (Empfohlen)

```sql
-- sql/get-items-for-module.sql

CREATE OR REPLACE FUNCTION get_items_for_module(
  p_student_id UUID,
  p_type TEXT,
  p_mode TEXT DEFAULT 'review',
  p_limit INT DEFAULT 10
)
RETURNS TABLE (
  id INT,
  type TEXT,
  english TEXT,
  russian TEXT,
  greek TEXT,
  level TEXT,
  difficulty TEXT,
  ease_factor NUMERIC,
  interval_days INT,
  next_review TIMESTAMPTZ,
  attempts INT,
  correct_count INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_level TEXT;
  v_user_difficulty TEXT;
BEGIN
  -- Get user's level and difficulty
  SELECT level, difficulty INTO v_user_level, v_user_difficulty
  FROM users WHERE id = p_student_id;

  -- Return items based on mode
  RETURN QUERY
  SELECT
    li.id,
    li.type,
    li.english,
    li.russian,
    li.greek,
    li.level,
    li.difficulty,
    COALESCE(sp.ease_factor, 2.5) AS ease_factor,
    COALESCE(sp.interval_days, 0) AS interval_days,
    sp.next_review,
    COALESCE(sp.attempts, 0) AS attempts,
    COALESCE(sp.correct_count, 0) AS correct_count
  FROM learning_items li
  LEFT JOIN student_progress sp ON li.id = sp.item_id AND sp.student_id = p_student_id
  WHERE
    li.type = p_type
    AND (
      -- Mode: 'weak' - Items with low ease factor
      (p_mode = 'weak' AND COALESCE(sp.ease_factor, 2.5) < 2.0)
      -- Mode: 'due' - Items due for review
      OR (p_mode = 'due' AND sp.next_review < NOW())
      -- Mode: 'review' - All items
      OR (p_mode = 'review')
    )
    AND (
      -- Level/Difficulty matching (3-tier fallback)
      (li.level = v_user_level AND li.difficulty = v_user_difficulty)
      OR (li.level = v_user_level)
      OR (TRUE)  -- All items if no match
    )
  ORDER BY
    -- Prioritize due items, then by attempts (less practiced first)
    CASE WHEN sp.next_review < NOW() THEN 0 ELSE 1 END,
    COALESCE(sp.attempts, 0) ASC
  LIMIT p_limit;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_items_for_module TO anon, authenticated;
```

---

### **2. Tabellen-Schema** (Referenz)

```sql
-- learning_items (bereits vorhanden)
CREATE TABLE learning_items (
  id SERIAL PRIMARY KEY,
  type TEXT NOT NULL,
  english TEXT NOT NULL,
  russian TEXT,
  greek TEXT NOT NULL,
  example_en TEXT,
  example_gr TEXT,
  audio_url TEXT,
  level TEXT DEFAULT 'A1',
  difficulty TEXT DEFAULT 'easy',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- student_progress (bereits vorhanden)
CREATE TABLE student_progress (
  id SERIAL PRIMARY KEY,
  student_id UUID REFERENCES users(id) ON DELETE CASCADE,
  item_id INT REFERENCES learning_items(id) ON DELETE CASCADE,
  ease_factor NUMERIC DEFAULT 2.5,
  interval_days INT DEFAULT 0,
  next_review TIMESTAMPTZ DEFAULT NOW(),
  attempts INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  last_attempt TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(student_id, item_id)
);
```

---

### **3. TypeScript Supabase-Client**

```typescript
// lib/supabaseClient.ts (bereits vorhanden)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Beispiel: RPC aufrufen
const { data, error } = await supabase.rpc('get_items_for_module', {
  p_student_id: user.id,
  p_type: 'vocabulary',
  p_mode: 'due',
  p_limit: 10
});
```

---

## 🌍 MULTI-LANGUAGE SUPPORT

### **1. Translation Keys** (useTranslation Hook)

```typescript
// lib/useTranslation.ts (bereits vorhanden)
import { useLanguage } from '@/context/LanguageContext';

export function useTranslation() {
  const { locale } = useLanguage();
  const [translations, setTranslations] = useState({});

  // Übersetzung abrufen
  const t = (key: string, params?: Record<string, any>): string => {
    let text = translations[key] || FALLBACK_EN[key] || key;

    // Template-Substitution
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, v);
      });
    }

    return text;
  };

  return { t, locale };
}
```

---

### **2. Translation Keys für neue Module**

```typescript
// Minimale Keys für jedes Modul:
const MODULE_KEYS = {
  // Titel & Untertitel
  'modul.title': 'Modul Title',
  'modul.subtitle': 'Modul Subtitle',

  // Loading-States
  'modul.loading': 'Loading...',
  'modul.loading_subtitle': 'Please wait',

  // Fehler-States
  'modul.login_required': 'Please log in',
  'modul.no_items': 'No items available',
  'modul.error': 'An error occurred',

  // Session-Summary
  'modul.session_complete': 'Session Complete!',
  'shared.correct': 'Correct',
  'shared.wrong': 'Wrong',
  'shared.back_to_dashboard': 'Back to Dashboard',

  // Buttons
  'btn.hard': 'Hard',
  'btn.good': 'Good',
  'btn.easy': 'Easy',
  'btn.restart': 'Restart',
  'btn.cancel': 'Cancel',
  'btn.next': 'Next',
  'btn.submit': 'Submit',
  'btn.retry': 'Retry'
};
```

---

### **3. SQL: Translation Keys einfügen**

```sql
-- sql/insert-module-translations.sql

INSERT INTO ui_translations (key, lang, value, context) VALUES
  -- English
  ('modul.title', 'en', 'Modul Title', 'modul'),
  ('modul.subtitle', 'en', 'Modul Subtitle', 'modul'),
  ('modul.loading', 'en', 'Loading...', 'modul'),
  -- Russian
  ('modul.title', 'ru', 'Название модуля', 'modul'),
  ('modul.subtitle', 'ru', 'Подзаголовок модуля', 'modul'),
  -- Greek
  ('modul.title', 'el', 'Τίτλος Ενότητας', 'modul'),
  -- German
  ('modul.title', 'de', 'Modul-Titel', 'modul')
ON CONFLICT (key, lang) DO UPDATE
  SET value = EXCLUDED.value;
```

---

### **4. Locale-abhängige Anzeige** (Source Language)

```tsx
// Zeigt english oder russian basierend auf UI-Sprache
const sourceLanguage = locale === 'ru' && item.russian ? item.russian : item.english;

<div className="text-xl font-semibold text-white mb-2">
  {sourceLanguage}
</div>
```

---

## 📱 DESKTOP/MOBILE KONSISTENZ

### **1. Shared Contexts** (Wiederverwendung)

```tsx
// Alle Module nutzen dieselben Contexts
import { useAuth } from '@/context/AuthContext';        // User, Login-Status
import { useLanguage } from '@/context/LanguageContext'; // Locale, setLocale
import { useTranslation } from '@/lib/useTranslation';   // t() Funktion
```

---

### **2. Responsive Dialog-Größe**

```tsx
// Desktop: max-w-2xl (672px)
// Mobile: max-w-full mit Padding

<div className="
  fixed inset-0 z-50 flex items-center justify-center p-4
  bg-black/60 backdrop-blur-sm
">
  <div className="
    relative w-full
    max-w-full          /* Mobile: Full Width */
    md:max-w-2xl        /* Desktop: 672px */
    bg-gradient-to-br from-slate-900/95 to-slate-800/95
    backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10
  ">
    {/* Dialog Content */}
  </div>
</div>
```

---

### **3. Touch vs. Mouse Interaktion**

```tsx
// Touch-Events (Mobile)
onTouchStart, onTouchEnd, onTouchMove

// Mouse-Events (Desktop)
onClick, onMouseEnter, onMouseLeave

// Hybrid (beide unterstützen)
<button
  onClick={handleClick}           // Desktop: Click
  onTouchEnd={handleClick}        // Mobile: Touch
  className="min-w-[44px] min-h-[44px]"
>
  Button
</button>
```

---

### **4. Glasmorphismus-Konsistenz**

```tsx
// Desktop & Mobile identisch
const GLASSMORPHISM_CLASSES = {
  container: 'bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10',
  header: 'bg-gradient-to-r from-purple-500/10 to-blue-500/10 border-b border-white/10',
  card: 'bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg',
  button: 'bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 hover:scale-105'
};
```

---

## ✅ TESTING & QUALITÄTSSICHERUNG

### **1. Unit-Tests** (Optional, empfohlen)

```typescript
// {modul-name}.test.tsx

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ModulDialog from './ModulDialog';

describe('ModulDialog', () => {
  it('renders loading state initially', () => {
    render(<ModulDialog isOpen={true} onClose={() => {}} />);
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('fetches items on mount', async () => {
    render(<ModulDialog isOpen={true} onClose={() => {}} />);
    await waitFor(() => {
      expect(screen.getByText(/item 1/i)).toBeInTheDocument();
    });
  });

  it('handles score correctly', async () => {
    render(<ModulDialog isOpen={true} onClose={() => {}} />);
    const easyButton = await screen.findByText(/easy/i);
    fireEvent.click(easyButton);
    await waitFor(() => {
      expect(screen.getByText(/item 2/i)).toBeInTheDocument();
    });
  });
});
```

---

### **2. E2E-Tests** (Playwright)

```typescript
// e2e/modul-dialog.spec.ts

import { test, expect } from '@playwright/test';

test('completes full session', async ({ page }) => {
  await page.goto('http://localhost:3000/login-pin');
  await page.fill('input[type="tel"]', '1234');
  await page.click('button[type="submit"]');

  // Öffne Modul
  await page.click('text=Modul Name');

  // 10 Items durchgehen (Easy klicken)
  for (let i = 0; i < 10; i++) {
    await page.click('button:has-text("Easy")');
    await page.waitForTimeout(500);
  }

  // Session Complete
  await expect(page.locator('text=Session Complete')).toBeVisible();
});
```

---

### **3. Accessibility (A11y)**

```tsx
// Screen-Reader Support
<button
  onClick={handleNext}
  aria-label={t('btn.next_aria', { current: currentIndex + 1, total: items.length })}
  className="..."
>
  {t('btn.next')}
</button>

// Focus-Management
useEffect(() => {
  if (isOpen) {
    // Focus auf ersten Button
    document.getElementById('first-button')?.focus();
  }
}, [isOpen]);

// Keyboard-Navigation
<div
  onKeyDown={(e) => {
    if (e.key === 'Escape') onClose();
    if (e.key === 'Enter') handleNext();
  }}
  tabIndex={0}
>
  {/* Content */}
</div>
```

---

### **4. Performance**

```tsx
// React.memo für schwere Komponenten
export const Flashcard = React.memo(({ item, onScore }: FlashcardProps) => {
  // ...
}, (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id;
});

// useMemo für berechnete Werte
const filteredItems = useMemo(() => {
  return items.filter(item => item.ease_factor < 2.0);
}, [items]);

// useCallback für Event-Handler
const handleScore = useCallback((quality: number) => {
  // ...
}, [currentItem, user]);
```

---

## 📋 CHECKLISTE FÜR NEUE MODULE

### **Phase 1: Planung** (1-2h)
- [ ] **Modul-Typ definieren** (Vokabeln, Grammatik, Phrasen, etc.)
- [ ] **Ziel-Verzeichnis erstellen** (`/modules/{modul-name}/`)
- [ ] **README.md erstellen** (Beschreibung, Ziele, Features)
- [ ] **todo.md erstellen** (Modul-spezifische TODOs)
- [ ] **TypeScript-Interfaces definieren** (`{modul-name}.types.ts`)

---

### **Phase 2: Datenbank** (1-2h)
- [ ] **SQL-Tabellen erstellen** (falls nötig)
  - [ ] `sql/create-tables.sql`
  - [ ] RLS-Policies definieren
  - [ ] Indizes erstellen
- [ ] **RPC-Funktionen erstellen**
  - [ ] `sql/create-rpc.sql`
  - [ ] `get_items_for_module()` mit 3-Tier-Filter
  - [ ] SECURITY DEFINER + GRANT EXECUTE
- [ ] **Seed-Daten erstellen** (optional)
  - [ ] `sql/seed-data.sql`
  - [ ] Min. 10 Test-Items (A1-easy)

---

### **Phase 3: Komponente** (3-5h)
- [ ] **Haupt-Dialog-Komponente erstellen** (`{modul-name}Dialog.tsx`)
  - [ ] State-Management (loading, items, currentIndex, sessionStats, isComplete)
  - [ ] Data-Fetching (3-Tier-Strategie: RPC → Direct → Fallback)
  - [ ] Event-Handlers (handleScore, handleNext, handleRestart)
  - [ ] Glasmorphismus-Design (konsistent)
- [ ] **Custom Hooks erstellen** (optional)
  - [ ] `useModulData.ts` (Data-Fetching-Logik)
  - [ ] `useModulProgress.ts` (SRS-Progress-Tracking)

---

### **Phase 4: SRS-Integration** (1-2h)
- [ ] **SM2-Algorithm integrieren** (`lib/sm2.ts` wiederverwendbar)
- [ ] **Rating-Buttons** (Hard/Good/Easy)
- [ ] **Progress speichern** (`student_progress` Tabelle)
- [ ] **Performance-Evaluation** (optional, `usePerformanceEvaluation` Hook)

---

### **Phase 5: Multi-Language** (1h)
- [ ] **Translation Keys definieren** (min. 15 Keys)
  - [ ] Titel, Untertitel, Loading, Error, Summary, Buttons
- [ ] **SQL einfügen** (`sql/insert-translations.sql`)
  - [ ] EN, RU, EL, DE (4 Locales)
- [ ] **Fallback-Texte** (`FALLBACK_EN` in Component)
- [ ] **Locale-abhängige Anzeige** (Source Language: EN/RU)

---

### **Phase 6: Tests** (1-2h)
- [ ] **Unit-Tests** (optional)
  - [ ] Loading-State
  - [ ] Data-Fetching
  - [ ] Score-Handling
- [ ] **E2E-Tests** (optional)
  - [ ] Full Session Flow
  - [ ] Error-Handling
- [ ] **Accessibility-Tests**
  - [ ] Screen-Reader Support
  - [ ] Keyboard-Navigation

---

### **Phase 7: Integration** (30min)
- [ ] **Dashboard-Integration**
  - [ ] Import in `dashboard/page.tsx`
  - [ ] State (`isModulDialogOpen`)
  - [ ] Button onClick → `setIsModulDialogOpen(true)`
- [ ] **ActionGrid/ModuleGrid** (falls vorhanden)
  - [ ] Neuen Button hinzufügen
  - [ ] Icon + Label (übersetzt)

---

### **Phase 8: Dokumentation** (30min)
- [ ] **README.md aktualisieren**
  - [ ] Features-Liste
  - [ ] Setup-Anleitung
  - [ ] Screenshots (optional)
- [ ] **todo.md aktualisieren** (TODOs abschließen)
- [ ] **Zentrale TODO.md aktualisieren** (Cross-Reference)
- [ ] **PROJECT_OVERVIEW.md erweitern** (neues Modul dokumentieren)

---

### **Phase 9: Deployment** (15min)
- [ ] **SQL-Migrationen ausführen** (Supabase SQL Editor)
- [ ] **ENV-Variablen prüfen** (falls neue nötig)
- [ ] **Build testen** (`npm run build`)
- [ ] **Production-Tests** (siehe Aufgabe 3 in TODO.md)

---

## 🎯 BEISPIEL-WORKFLOW

### **Szenario: "Due Cards Today" Modul erstellen**

```bash
# 1. Verzeichnis erstellen
mkdir -p modules/due-cards-today/sql
cd modules/due-cards-today

# 2. Dateien erstellen
touch README.md todo.md DueCardsDialog.tsx DueCardsDialog.types.ts useDueCards.ts
touch sql/get-due-cards-rpc.sql sql/insert-translations.sql

# 3. README.md füllen (Modul-Beschreibung)
# ...

# 4. SQL erstellen (RPC-Funktion)
# ...

# 5. TypeScript-Interfaces definieren
# ...

# 6. Komponente implementieren (basierend auf VocabularyDialog)
# ...

# 7. Dashboard-Integration
# import DueCardsDialog in dashboard/page.tsx

# 8. Tests
npm run test

# 9. Build
npm run build

# 10. Deployment
# SQL in Supabase ausführen
# Git commit + push
```

---

## 📚 REFERENZEN

### **Existierende Module (Best Practices):**
- ✅ `src/components/learning/VocabularyDialog.tsx` - **VOLLSTÄNDIGSTE Implementierung**
- ✅ `src/components/learning/GrammarDialog.tsx` - Ähnlich wie Vocabulary
- ✅ `src/components/learning/Flashcard.tsx` - Wiederverwendbare Card-Komponente
- ✅ `src/lib/sm2.ts` - SM2-Algorithm (wiederverwendbar)
- ✅ `src/lib/usePerformanceEvaluation.ts` - Auto-Leveling Hook

### **Dokumentation:**
- 📄 `active-deploy/project-overview.md` - Architektur (16 Kapitel)
- 📄 `active-deploy/logic-overview.md` - Technische Logik (13 Kapitel)
- 📄 `active-deploy/mobile-app-abspaltung-todos.md` - Mobile-Architektur
- 📄 `active-deploy/lerndialoge-allgemein.md` - KI-Richtlinien
- 📄 `TODO.md` (Root) - Zentrale TODO-Liste

### **SQL-Beispiele:**
- 📄 `supabase/fix_student_management_v2.sql` - Users + RPC
- 📄 `supabase/create_performance_evaluation.sql` - Performance-Log + RPC
- 📄 `supabase/add_level_difficulty_to_learning_items.sql` - Level/Difficulty Filter

---

## ✨ ZUSAMMENFASSUNG

**Dieses Dokument ist die zentrale Referenz für:**
1. ✅ **Struktur** - Wie ein Modul organisiert wird
2. ✅ **Design** - Glasmorphismus, Touch-Optimierung, Responsive
3. ✅ **Technik** - TypeScript, Hooks, Fehlerbehandlung
4. ✅ **SRS** - SM2-Algorithm, Progress-Tracking
5. ✅ **Datenbank** - RPC-Funktionen, Tabellen-Schema
6. ✅ **Sprachen** - Multi-Language Support (4 Locales)
7. ✅ **Konsistenz** - Desktop/Mobile Sharing
8. ✅ **Tests** - Unit, E2E, Accessibility
9. ✅ **Checkliste** - 9 Phasen für neue Module

**Bei Fragen:** Siehe Referenzen oder `active-deploy/lerndialoge-allgemein.md` 🚀

---

**Letzte Aktualisierung:** 2026-02-14
**Version:** 1.0
**Maintainer:** KI-Assistenz (Claude/Grok) + Entwickler-Team
