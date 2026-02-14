# 📋 TODO: Due Cards Today Modul
**Status:** ⚠️ **IN PLANUNG** (Nur Platzhalter vorhanden)
**Priorität:** 🟡 **HOCH** (Kernmodul für Mobile)
**Aufwand:** 4-6 Stunden
**Letzte Aktualisierung:** 2026-02-14

---

## 🎯 MODUL-BESCHREIBUNG

**Zweck:** Zeigt dem Nutzer alle Vokabeln/Items, die heute für Review fällig sind (basierend auf SRS-Algorithm).

**SRS-Filter:** `next_review < NOW()` (aus `student_progress` Tabelle)

**Features:**
- ✅ Spaced Repetition System (SM2-Algorithm)
- ✅ Tagbasiertes Review-System
- ✅ Mobile-optimiertes Layout
- ✅ Swipe-Gesten (Hard/Good/Easy)
- ✅ Progress-Indicator
- ✅ Multi-Language Support (4 Locales)

---

## 🔴 KRITISCHE AUFGABEN (Vor Start)

### ⚠️ **Dependencies**
- [ ] **SQL-Migrationen ausführen** (siehe `TODO.md` Root, Aufgabe 1)
  - Benötigt: `student_progress` Tabelle
  - Benötigt: `learning_items` Tabelle mit `level` + `difficulty`
- [ ] **ENV-Variablen konfigurieren** (siehe `TODO.md` Root, Aufgabe 2)

---

## 📋 PHASE 1: PLANUNG (1-2h)

### ✅ **Bereits erledigt:**
- [x] Modul-Verzeichnis erstellt (`/modules/due-cards-today/`)
- [x] Platzhalter-Datei erstellt (`due-cards-today.md`)

### ⚠️ **Offen:**
- [ ] **README.md erstellen**
  - [ ] Modul-Beschreibung (Zweck, Features)
  - [ ] Zielgruppe (Schüler, tägliches Review)
  - [ ] Screenshots (optional, später)
- [ ] **TypeScript-Interfaces definieren**
  - [ ] `DueCardsDialog.types.ts` erstellen
  - [ ] `DueCardItem` Interface (erweitert `LearningItemWithProgress`)
  - [ ] `DueCardsDialogProps` Interface
  - [ ] `DueCardsStats` Interface
- [ ] **Wireframe skizzieren** (optional)
  - [ ] Mobile-Layout (320px - 768px)
  - [ ] Desktop-Layout (1024px+)

**Aufwand:** 1-2 Stunden

---

## 🗄️ PHASE 2: DATENBANK (1-2h)

### A) **RPC-Funktion erstellen**
- [ ] **Datei erstellen:** `sql/get-due-cards-rpc.sql`
- [ ] **Funktion:** `get_due_cards_today(p_student_id, p_limit)`
  - [ ] Filter: `next_review < NOW()`
  - [ ] LEFT JOIN mit `student_progress`
  - [ ] Level/Difficulty Matching (3-Tier-Fallback)
  - [ ] Sortierung: Due items first, dann nach `attempts` ASC
  - [ ] LIMIT: Standard 10, max 50
  - [ ] SECURITY DEFINER + GRANT EXECUTE
- [ ] **SQL in Supabase ausführen** (Supabase SQL Editor)
- [ ] **Verifizieren:**
  ```sql
  SELECT * FROM get_due_cards_today(
    '<user-id>'::UUID,
    10
  );
  ```

**Referenz:** `supabase/add_level_difficulty_to_learning_items.sql` (Ähnliche Struktur)

---

### B) **Zusätzliche RPC-Funktionen** (Optional)
- [ ] **`get_due_cards_count(p_student_id)`** - Gibt Anzahl fälliger Karten zurück
  - Für Dashboard-Anzeige: "📚 Due Cards Today (5)"
- [ ] **`mark_cards_completed(p_student_id, p_item_ids, p_ratings)`** - Batch-Update
  - Optimierung: Mehrere Cards in einem Call updaten

**Aufwand:** 1-2 Stunden

---

## 🎨 PHASE 3: KOMPONENTE (3-5h)

### A) **Haupt-Dialog-Komponente**
- [ ] **Datei erstellen:** `DueCardsDialog.tsx`
- [ ] **State-Management:**
  ```tsx
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<DueCardItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, wrong: 0 });
  const [isComplete, setIsComplete] = useState(false);
  ```
- [ ] **Data-Fetching** (3-Tier-Strategie):
  - [ ] Priority 1: RPC `get_due_cards_today()`
  - [ ] Priority 2: Direkte Query (Fallback)
  - [ ] Priority 3: Hardcoded Fallback (10 Items)
- [ ] **Event-Handlers:**
  - [ ] `handleScore(rating: 'hard' | 'good' | 'easy')` - SM2 + Save Progress
  - [ ] `handleNext()` - Nächste Karte
  - [ ] `handleRestart()` - Session neu starten
  - [ ] `handleClose()` - Dialog schließen
- [ ] **UI-Rendering:**
  - [ ] Header (Titel, Untertitel, Close-Button)
  - [ ] Loading-State (Spinner + Text)
  - [ ] Empty-State (Keine fälligen Karten)
  - [ ] Flashcard-Ansicht (Vorderseite/Rückseite)
  - [ ] Rating-Buttons (Hard/Good/Easy, Touch-optimiert 44x44px)
  - [ ] Progress-Indicator (z.B. "5 / 10")
  - [ ] Summary-Screen (Korrekt/Falsch, Restart-Button)
  - [ ] Footer (Abbrechen-Button)
- [ ] **Glasmorphismus-Design** (konsistent mit anderen Modulen)
  ```tsx
  className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10"
  ```

**Referenz:** `src/components/learning/VocabularyDialog.tsx` (Als Basis verwenden)

---

### B) **Custom Hooks** (Optional, empfohlen)
- [ ] **Datei erstellen:** `useDueCards.ts`
  - [ ] `useDueCards(limit: number)` Hook
  - [ ] Data-Fetching-Logik auslagern
  - [ ] Return: `{ items, loading, error, refetch }`
- [ ] **Datei erstellen:** `useDueCardsProgress.ts` (Optional)
  - [ ] `useDueCardsProgress()` Hook
  - [ ] SRS-Progress-Tracking
  - [ ] Save-Logik auslagern

**Aufwand:** 3-5 Stunden

---

## 🔄 PHASE 4: SRS-INTEGRATION (1-2h)

### A) **SM2-Algorithm** (Bereits vorhanden, wiederverwenden)
- [ ] **Import:** `import { calculateSM2 } from '@/lib/sm2';`
- [ ] **Rating-Config:**
  ```tsx
  const RATING_CONFIG = {
    hard: { quality: 3, label: 'btn.hard', color: 'red', rating: 1.0 },
    good: { quality: 4, label: 'btn.good', color: 'yellow', rating: 2.5 },
    easy: { quality: 5, label: 'btn.easy', color: 'green', rating: 3.0 }
  };
  ```
- [ ] **handleScore Implementierung:**
  ```tsx
  const handleScore = async (rating: 'hard' | 'good' | 'easy') => {
    const config = RATING_CONFIG[rating];
    const item = items[currentIndex];

    // SM2-Berechnung
    const sm2 = calculateSM2(config.quality, {
      ease_factor: item.ease_factor || 2.5,
      interval_days: item.interval_days || 0,
      repetition: item.attempts || 0
    });

    // Progress speichern
    await saveProgress(item.id, sm2, config.quality >= 4);

    // Stats aktualisieren
    setSessionStats(prev => ({
      correct: prev.correct + (config.quality >= 4 ? 1 : 0),
      wrong: prev.wrong + (config.quality < 4 ? 1 : 0)
    }));

    // Nächste Karte
    handleNext();
  };
  ```

---

### B) **Progress speichern**
- [ ] **Funktion:** `saveProgress(itemId, sm2, isCorrect)`
  - [ ] Berechne `next_review` Datum (+interval_days)
  - [ ] UPSERT in `student_progress` Tabelle
  - [ ] Felder: `ease_factor`, `interval_days`, `next_review`, `attempts`, `correct_count`, `last_attempt`
  - [ ] Error-Handling (console.error bei Fehler)

**Referenz:** `src/components/learning/VocabularyDialog.tsx` (handleScore Methode)

**Aufwand:** 1-2 Stunden

---

## 🌍 PHASE 5: MULTI-LANGUAGE (1h)

### A) **Translation Keys definieren**
- [ ] **Minimale Keys** (15 erforderlich):
  ```typescript
  'due_cards.title'              // "Due Cards Today"
  'due_cards.subtitle'           // "Review cards scheduled for today"
  'due_cards.loading'            // "Loading due cards..."
  'due_cards.loading_subtitle'   // "Please wait"
  'due_cards.login_required'     // "Please log in"
  'due_cards.no_items'           // "No cards due today! 🎉"
  'due_cards.no_items_tip'       // "Check back tomorrow"
  'due_cards.error'              // "An error occurred"
  'due_cards.session_complete'   // "Session Complete!"
  'due_cards.cards_reviewed'     // "Cards reviewed"
  'shared.correct'               // "Correct"
  'shared.wrong'                 // "Wrong"
  'btn.hard' / 'btn.good' / 'btn.easy'
  'btn.restart' / 'btn.cancel'
  ```

---

### B) **SQL-INSERT erstellen**
- [ ] **Datei erstellen:** `sql/insert-translations.sql`
- [ ] **4 Locales einfügen:** EN, RU, EL, DE
  ```sql
  INSERT INTO ui_translations (key, lang, value, context) VALUES
    -- English
    ('due_cards.title', 'en', 'Due Cards Today', 'due_cards'),
    ('due_cards.subtitle', 'en', 'Review cards scheduled for today', 'due_cards'),
    -- Russian
    ('due_cards.title', 'ru', 'Карточки на сегодня', 'due_cards'),
    -- Greek
    ('due_cards.title', 'el', 'Κάρτες για σήμερα', 'due_cards'),
    -- German
    ('due_cards.title', 'de', 'Fällige Karten heute', 'due_cards')
  ON CONFLICT (key, lang) DO UPDATE
    SET value = EXCLUDED.value;
  ```
- [ ] **SQL in Supabase ausführen**

---

### C) **Fallback-Texte** (Komponente)
- [ ] **Fallback-Objekt in Komponente:**
  ```tsx
  const FALLBACK_TRANSLATIONS = {
    'due_cards.title': 'Due Cards Today',
    'due_cards.subtitle': 'Review cards scheduled for today',
    // ...
  };
  ```
- [ ] **Locale-abhängige Anzeige:**
  ```tsx
  const sourceLanguage = locale === 'ru' && item.russian ? item.russian : item.english;
  ```

**Aufwand:** 1 Stunde

---

## 📱 PHASE 6: MOBILE-OPTIMIERUNG (1-2h)

### A) **Touch-Optimierung**
- [ ] **Button-Größe:** Min 44x44px (Apple HIG)
  ```tsx
  <button className="min-w-[44px] min-h-[44px] p-3">
    Hard
  </button>
  ```
- [ ] **Tap-Feedback:** Haptic Feedback (optional)
  ```tsx
  navigator.vibrate?.(50); // 50ms Vibration
  ```

---

### B) **Swipe-Gesten** (Optional, Nice-to-Have)
- [ ] **Library installieren:** `npm install react-swipeable`
- [ ] **Swipe-Handler:**
  ```tsx
  import { useSwipeable } from 'react-swipeable';

  const handlers = useSwipeable({
    onSwipedLeft: () => handleScore('hard'),   // Swipe links = Hard
    onSwipedRight: () => handleScore('easy'),  // Swipe rechts = Easy
    onSwipedUp: () => handleScore('good'),     // Swipe hoch = Good
    preventScrollOnSwipe: true,
    trackMouse: true
  });

  <div {...handlers} className="swipeable-card">
    {/* Flashcard */}
  </div>
  ```
- [ ] **Swipe-Indikator** (visuelles Feedback während Swipe)

---

### C) **Responsive Breakpoints**
- [ ] **Mobile:** `320px - 768px` (Full Width)
- [ ] **Tablet:** `768px - 1024px` (max-w-xl)
- [ ] **Desktop:** `1024px+` (max-w-2xl)
  ```tsx
  <div className="
    w-full max-w-full        /* Mobile */
    md:max-w-xl              /* Tablet */
    lg:max-w-2xl             /* Desktop */
  ">
  ```

**Aufwand:** 1-2 Stunden

---

## ✅ PHASE 7: TESTS (1-2h, Optional)

### A) **Unit-Tests**
- [ ] **Datei erstellen:** `DueCardsDialog.test.tsx`
- [ ] **Tests:**
  - [ ] Renders loading state initially
  - [ ] Fetches items on mount
  - [ ] Handles score correctly (Hard/Good/Easy)
  - [ ] Shows summary after all cards
  - [ ] Restart button works

---

### B) **E2E-Tests** (Playwright)
- [ ] **Datei erstellen:** `e2e/due-cards-dialog.spec.ts`
- [ ] **Tests:**
  - [ ] Full session flow (10 Cards → Summary)
  - [ ] Empty state (keine fälligen Karten)
  - [ ] Error handling (Supabase down)

---

### C) **Accessibility**
- [ ] **Screen-Reader Support**
  - [ ] `aria-label` für alle Buttons
  - [ ] `role="dialog"` für Modal
- [ ] **Keyboard-Navigation**
  - [ ] Escape → Close
  - [ ] Enter → Next
  - [ ] 1/2/3 → Hard/Good/Easy

**Aufwand:** 1-2 Stunden

---

## 🔗 PHASE 8: INTEGRATION (30min)

### A) **Dashboard-Integration**
- [ ] **Datei öffnen:** `src/app/dashboard/page.tsx`
- [ ] **Import:**
  ```tsx
  import DueCardsDialog from '@/modules/due-cards-today/DueCardsDialog';
  ```
- [ ] **State hinzufügen:**
  ```tsx
  const [isDueCardsDialogOpen, setIsDueCardsDialogOpen] = useState(false);
  ```
- [ ] **Button onClick:**
  ```tsx
  <div onClick={() => setIsDueCardsDialogOpen(true)}>
    📚 Due Cards Today
  </div>
  ```
- [ ] **Dialog rendern:**
  ```tsx
  <DueCardsDialog
    isOpen={isDueCardsDialogOpen}
    onClose={() => setIsDueCardsDialogOpen(false)}
  />
  ```

---

### B) **ActionGrid/ModuleGrid** (Falls vorhanden)
- [ ] **Neuen Button hinzufügen:**
  ```tsx
  {
    icon: '📚',
    title: t('modules.due_cards'),
    subtitle: t('modules.due_cards_subtitle'),
    onClick: () => setIsDueCardsDialogOpen(true)
  }
  ```

**Aufwand:** 30 Minuten

---

## 📚 PHASE 9: DOKUMENTATION (30min)

### A) **README.md aktualisieren**
- [ ] **Beschreibung:** Was macht das Modul?
- [ ] **Features-Liste** (mit Checkboxen)
- [ ] **Setup-Anleitung:**
  - [ ] SQL-Migration ausführen
  - [ ] Translation-Keys einfügen
  - [ ] Dashboard-Integration
- [ ] **Screenshots** (optional, später)

---

### B) **todo.md aktualisieren**
- [ ] Erledigte TODOs abschließen
- [ ] Status auf "✅ ABGESCHLOSSEN" setzen

---

### C) **Zentrale TODO.md aktualisieren**
- [ ] **Root `TODO.md`** - Modul-Status aktualisieren
- [ ] **`active-deploy/todo-overview.md`** - Phase aktualisieren

---

### D) **PROJECT_OVERVIEW.md erweitern**
- [ ] **Kapitel 4:** Learning Modules
  - [ ] Neue Zeile hinzufügen:
    ```markdown
    | **Due Cards Today** | `DueCardsDialog.tsx` | SRS-based review, daily due cards |
    ```

**Aufwand:** 30 Minuten

---

## 🚀 PHASE 10: DEPLOYMENT (15min)

### A) **SQL-Migrationen ausführen**
- [ ] **Supabase SQL Editor öffnen**
- [ ] **`sql/get-due-cards-rpc.sql` ausführen**
- [ ] **`sql/insert-translations.sql` ausführen**
- [ ] **Verifizieren:**
  ```sql
  -- Test RPC
  SELECT * FROM get_due_cards_today('<user-id>'::UUID, 10);

  -- Test Translations
  SELECT * FROM ui_translations WHERE key LIKE 'due_cards.%';
  ```

---

### B) **Build testen**
- [ ] **Lokaler Build:**
  ```bash
  npm run build
  ```
- [ ] **Dev-Server testen:**
  ```bash
  npm run dev
  # Öffne http://localhost:3000
  # Login → Dashboard → Due Cards Today Button klicken
  ```

---

### C) **Production-Tests**
- [ ] **Test 1:** Login mit 4-Digit PIN
- [ ] **Test 2:** Due Cards Dialog öffnen
- [ ] **Test 3:** 10 Cards reviewen (Hard/Good/Easy)
- [ ] **Test 4:** Summary-Screen prüfen
- [ ] **Test 5:** Restart-Button testen
- [ ] **Test 6:** Multi-Language Switch (EN/RU/EL/DE)
- [ ] **Test 7:** Mobile Responsiveness (320px - 768px)

**Aufwand:** 15 Minuten

---

## 📊 STATUS-ÜBERSICHT

| Phase | Status | Aufwand | Priorität |
|-------|--------|---------|-----------|
| **Phase 1: Planung** | ⚠️ OFFEN | 1-2h | 🟡 HOCH |
| **Phase 2: Datenbank** | ⚠️ OFFEN | 1-2h | 🔴 KRITISCH |
| **Phase 3: Komponente** | ⚠️ OFFEN | 3-5h | 🔴 KRITISCH |
| **Phase 4: SRS-Integration** | ⚠️ OFFEN | 1-2h | 🔴 KRITISCH |
| **Phase 5: Multi-Language** | ⚠️ OFFEN | 1h | 🟡 HOCH |
| **Phase 6: Mobile-Optimierung** | ⚠️ OFFEN | 1-2h | 🟡 HOCH |
| **Phase 7: Tests** | ⚠️ OFFEN | 1-2h | 🟢 OPTIONAL |
| **Phase 8: Integration** | ⚠️ OFFEN | 30min | 🟡 HOCH |
| **Phase 9: Dokumentation** | ⚠️ OFFEN | 30min | 🟢 MITTEL |
| **Phase 10: Deployment** | ⚠️ OFFEN | 15min | 🔴 KRITISCH |

**Gesamtaufwand:** 10-17 Stunden (ohne Tests: 8-13 Stunden)

---

## 🔗 CROSS-REFERENCES

**Dokumentation:**
- 📄 `active-deploy/MODULE_DIALOGE_ALLGEMEIN.md` - Allgemeine Vorlage für Dialog-Module
- 📄 `active-deploy/project-overview.md` - Architektur
- 📄 `active-deploy/logic-overview.md` - Technische Logik
- 📄 `TODO.md` (Root) - Zentrale TODO-Liste

**Code-Referenzen:**
- 📄 `src/components/learning/VocabularyDialog.tsx` - **BESTE Referenz** (Als Basis verwenden)
- 📄 `src/components/learning/Flashcard.tsx` - Wiederverwendbare Card-Komponente
- 📄 `src/lib/sm2.ts` - SM2-Algorithm (wiederverwendbar)
- 📄 `src/lib/usePerformanceEvaluation.ts` - Auto-Leveling Hook

**SQL-Referenzen:**
- 📄 `supabase/add_level_difficulty_to_learning_items.sql` - RPC mit Level/Difficulty Filter
- 📄 `supabase/create_performance_evaluation.sql` - Performance-Log + RPC

---

## 💡 TIPPS & TRICKS

1. **Starte mit VocabularyDialog als Basis:**
   - Kopiere `VocabularyDialog.tsx` → `DueCardsDialog.tsx`
   - Benenne Variablen um (`vocabulary` → `dueCards`)
   - Passe Filter an (`mode: 'due'` → hardcoded)

2. **RPC-Funktion ist der Schlüssel:**
   - Investiere Zeit in eine gute RPC-Funktion
   - 3-Tier-Filter: Exakt → Gleicher Level → Alle
   - Sortierung: Due items first, dann nach `attempts`

3. **Mobile-First entwickeln:**
   - Teste zuerst auf 320px Breite (iPhone SE)
   - Dann auf 768px (iPad Mini)
   - Dann auf Desktop (1024px+)

4. **Swipe-Gesten sind Nice-to-Have:**
   - Kann in Phase 6 übersprungen werden
   - Später hinzufügen als Enhancement

5. **Tests sind Optional:**
   - Phase 7 kann übersprungen werden für MVP
   - Später hinzufügen wenn Modul stabil läuft

---

## 🎯 NÄCHSTER SCHRITT (Empfohlen)

**START:** Phase 2 - Datenbank (1-2h)

**Warum:** RPC-Funktion ist Grundlage für alles andere

**Vorgehen:**
1. Erstelle `sql/get-due-cards-rpc.sql`
2. Kopiere Struktur aus `add_level_difficulty_to_learning_items.sql`
3. Passe Filter an: `next_review < NOW()`
4. Führe SQL in Supabase aus
5. Teste RPC mit Test-Query

**Danach:** Phase 3 - Komponente (3-5h)

---

**Viel Erfolg bei der Implementierung! 🚀**

Bei Fragen: Siehe `active-deploy/MODULE_DIALOGE_ALLGEMEIN.md` (vollständige Vorlage)
