# 📋 TODO: Short Stories Modul
**Status:** ⚠️ **NICHT ANALYSIERT** (Struktur vorhanden, aber nicht dokumentiert)
**Priorität:** 🟢 **MITTEL** (Erweiterungsmodul, nicht kritisch für MVP)
**Aufwand:** TBD (abhängig von Analyse-Ergebnis)
**Letzte Aktualisierung:** 2026-02-14

---

## 🎯 MODUL-BESCHREIBUNG

**Zweck:** *(TBD - Muss noch analysiert werden)*

Vermutlich: Zeigt kurze griechische Geschichten/Texte für Leseverständnis-Übungen.

**Mögliche Features:**
- Kurze Geschichten in Griechisch (mit Übersetzung?)
- Level-basierte Filterung (A1/A2/B1/B2)
- Vokabular-Highlighting (schwierige Wörter hervorheben)
- Verständnis-Fragen (Multiple Choice, Freitext)
- Audio-Narration (optional)

---

## 🔍 PHASE 1: ANALYSE (1-2h) 🔴 **KRITISCH**

### **Ziel:** Verstehen was bereits existiert

### A) **Verzeichnis-Struktur analysieren**
- [ ] **Dateien auflisten:**
  ```bash
  cd modules/short-stories
  ls -la
  ```
- [ ] **Anzahl Dateien:** 6 (laut Bash-Output)
- [ ] **Dateitypen:** HTML? JS? SQL? CSS?
- [ ] **Größe:** TBD

---

### B) **Code-Analyse**
- [ ] **Existierende Dateien öffnen und lesen**
- [ ] **Zweck identifizieren:**
  - Was macht das Modul?
  - Welche Funktionen sind bereits implementiert?
  - Gibt es SQL-Tabellen?
  - Gibt es Frontend-Code (HTML/React)?
- [ ] **Abhängigkeiten identifizieren:**
  - Supabase-Tabellen?
  - Externe APIs?
  - Shared Components?

---

### C) **Dokumentation erstellen**
- [ ] **README.md erstellen**
  - [ ] Modul-Beschreibung (basierend auf Analyse)
  - [ ] Features-Liste (was funktioniert bereits?)
  - [ ] Setup-Anleitung (falls nötig)
- [ ] **Status dokumentieren:**
  - [ ] Vollständig implementiert? ✅
  - [ ] Teilweise implementiert? ⚠️
  - [ ] Nur Platzhalter? ❌
- [ ] **TODOs identifizieren:**
  - [ ] Was fehlt?
  - [ ] Was muss angepasst werden (Desktop → Mobile)?
  - [ ] Was muss modernisiert werden (neue Tech-Stack)?

**Aufwand:** 1-2 Stunden

---

## 📋 PHASE 2: ENTSCHEIDUNG (30min)

### **Nach Analyse:**

**Szenario A: Modul ist vollständig (Frontend + Backend)**
→ Gehe zu Phase 3: Integration

**Szenario B: Modul ist teilweise implementiert (nur HTML/JS, kein React)**
→ Gehe zu Phase 4: Migration (HTML → React)

**Szenario C: Modul ist nur Platzhalter**
→ Gehe zu Phase 5: Neu-Implementierung (wie Due Cards Today)

**Szenario D: Modul ist veraltet / nicht mehr relevant**
→ Archivieren (`_archive/`) und aus TODO-Liste entfernen

---

### **Entscheidung treffen:**
- [ ] **User konsultieren:** Was ist der Plan für Short Stories?
- [ ] **Priorität neu bewerten:**
  - [ ] Ist es ein Kernmodul für Mobile?
  - [ ] Kann es später hinzugefügt werden?
  - [ ] Soll es archiviert werden?

**Aufwand:** 30 Minuten (Meeting/Diskussion)

---

## 🔧 PHASE 3: INTEGRATION (Szenario A) - 2-3h

**Falls Modul vollständig ist:**

### A) **TypeScript-Migration** (falls nötig)
- [ ] **Interfaces definieren:**
  ```tsx
  interface ShortStory {
    id: number;
    title: string;
    content: string;           // Griechischer Text
    translation?: string;      // Übersetzung (EN/RU/DE)
    level: 'A1' | 'A2' | 'B1' | 'B2';
    difficulty: 'easy' | 'middle' | 'hard';
    vocabulary?: string[];     // Schwierige Wörter
    questions?: Question[];    // Verständnis-Fragen
  }

  interface Question {
    id: number;
    question: string;
    options: string[];
    correct_answer: number;
  }
  ```

---

### B) **Supabase-Anbindung**
- [ ] **Tabelle prüfen:**
  ```sql
  SELECT * FROM short_stories LIMIT 1;
  ```
- [ ] **RPC-Funktion erstellen** (falls nicht vorhanden):
  ```sql
  CREATE FUNCTION get_short_stories(p_student_id, p_level, p_limit);
  ```
- [ ] **Frontend-Integration:**
  ```tsx
  const { data, error } = await supabase.rpc('get_short_stories', {
    p_student_id: user.id,
    p_level: user.level,
    p_limit: 5
  });
  ```

---

### C) **Dialog-Komponente erstellen**
- [ ] **Datei:** `ShortStoriesDialog.tsx`
- [ ] **Struktur:** Ähnlich wie `ComprehensionDialog.tsx`
- [ ] **Features:**
  - [ ] Story-Liste (Titel, Level, Schwierigkeit)
  - [ ] Story-Ansicht (Griechischer Text + Übersetzung)
  - [ ] Vokabular-Highlighting (schwierige Wörter)
  - [ ] Verständnis-Fragen (Multiple Choice)
  - [ ] Progress-Tracking (Story gelesen? Fragen beantwortet?)

---

### D) **Dashboard-Integration**
- [ ] **Import in `dashboard/page.tsx`**
- [ ] **Button hinzufügen:** 📖 Short Stories
- [ ] **State:** `isShortStoriesDialogOpen`

**Aufwand:** 2-3 Stunden

---

## 🔄 PHASE 4: MIGRATION (Szenario B) - 4-6h

**Falls Modul nur HTML/JS ist (kein React):**

### A) **HTML → React Komponente**
- [ ] **Struktur analysieren:**
  - [ ] HTML-Layout verstehen
  - [ ] CSS-Klassen identifizieren
  - [ ] JavaScript-Logik extrahieren
- [ ] **Neue Komponente erstellen:**
  ```tsx
  // ShortStoriesDialog.tsx
  export default function ShortStoriesDialog({ isOpen, onClose }) {
    // State
    const [stories, setStories] = useState([]);
    const [selectedStory, setSelectedStory] = useState(null);

    // Fetch Stories
    useEffect(() => {
      fetchStories();
    }, []);

    // Render
    return (
      <div className="...">
        {/* Story-Liste */}
        {/* Story-Ansicht */}
      </div>
    );
  }
  ```

---

### B) **CSS → Tailwind**
- [ ] **Alte CSS-Klassen durch Tailwind ersetzen:**
  ```tsx
  // Vorher (HTML):
  <div class="story-card">

  // Nachher (React):
  <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg p-4">
  ```
- [ ] **Glasmorphismus-Design anwenden**

---

### C) **JavaScript → TypeScript Hooks**
- [ ] **Event-Handler migrieren:**
  ```tsx
  // Vorher (JS):
  document.getElementById('story').addEventListener('click', ...)

  // Nachher (React):
  const handleStoryClick = (storyId) => { ... }
  ```
- [ ] **State-Management:**
  ```tsx
  const [stories, setStories] = useState([]);
  ```

**Aufwand:** 4-6 Stunden

---

## 🆕 PHASE 5: NEU-IMPLEMENTIERUNG (Szenario C) - 8-12h

**Falls Modul neu entwickelt werden muss:**

### **Siehe:**
- 📄 `active-deploy/MODULE_DIALOGE_ALLGEMEIN.md` - Vollständige Vorlage
- 📄 `modules/due-cards-today/todo.md` - Ähnliche Struktur

### **Phasen:**
1. Planung (1-2h)
2. Datenbank (1-2h)
3. Komponente (3-5h)
4. Multi-Language (1h)
5. Mobile-Optimierung (1-2h)
6. Integration (30min)
7. Dokumentation (30min)
8. Deployment (15min)

**Gesamtaufwand:** 8-12 Stunden

---

## 📦 PHASE 6: ARCHIVIERUNG (Szenario D) - 15min

**Falls Modul nicht mehr relevant:**

- [ ] **Ordner verschieben:**
  ```bash
  mkdir -p _archive/modules
  mv modules/short-stories _archive/modules/
  ```
- [ ] **README erstellen:** `_archive/modules/short-stories/ARCHIVED_README.md`
  - [ ] Grund für Archivierung
  - [ ] Datum
  - [ ] Alternative Module (falls vorhanden)
- [ ] **TODO-Listen aktualisieren:**
  - [ ] Zentrale `TODO.md` (Root)
  - [ ] `active-deploy/todo-overview.md`

**Aufwand:** 15 Minuten

---

## 📊 STATUS-ÜBERSICHT

| Phase | Status | Aufwand | Priorität |
|-------|--------|---------|-----------|
| **Phase 1: Analyse** | ⚠️ **OFFEN** | 1-2h | 🔴 **KRITISCH** |
| **Phase 2: Entscheidung** | ⚠️ **OFFEN** | 30min | 🔴 **KRITISCH** |
| **Phase 3: Integration (A)** | ⏸️ Abhängig | 2-3h | 🟢 MITTEL |
| **Phase 4: Migration (B)** | ⏸️ Abhängig | 4-6h | 🟢 MITTEL |
| **Phase 5: Neu-Implementierung (C)** | ⏸️ Abhängig | 8-12h | 🟢 MITTEL |
| **Phase 6: Archivierung (D)** | ⏸️ Abhängig | 15min | 🟢 NIEDRIG |

**Gesamtaufwand:** 1.5h - 14.5h (abhängig von Szenario)

---

## 🔗 CROSS-REFERENCES

**Dokumentation:**
- 📄 `active-deploy/MODULE_DIALOGE_ALLGEMEIN.md` - Vorlage für Dialog-Module
- 📄 `modules/due-cards-today/todo.md` - Ähnliche Modul-TODO
- 📄 `TODO.md` (Root) - Zentrale TODO-Liste

**Code-Referenzen:**
- 📄 `src/components/learning/ComprehensionDialog.tsx` - Ähnliche Struktur (Leseverständnis)
- 📄 `src/components/learning/VocabularyDialog.tsx` - Dialog-Basis

---

## 🎯 NÄCHSTER SCHRITT (Empfohlen)

**START:** Phase 1 - Analyse (1-2h) 🔴 **KRITISCH**

**Vorgehen:**
1. Öffne Ordner `modules/short-stories/`
2. Liste alle Dateien auf
3. Öffne und lese jede Datei
4. Dokumentiere Zweck und Status
5. Erstelle README.md mit Ergebnissen
6. Gehe zu Phase 2 - Entscheidung

**Hinweis:** Ohne Analyse können wir nicht fortfahren. Dies ist der Blocker.

---

## 💡 OFFENE FRAGEN (Für User)

1. **Was ist der Zweck von Short Stories?**
   - Leseverständnis?
   - Unterhaltung?
   - Kulturelle Einblicke?

2. **Ist das Modul bereits implementiert?**
   - Vollständig?
   - Teilweise?
   - Nur Platzhalter?

3. **Priorität für Mobile?**
   - Kernmodul (MVP)?
   - Nice-to-Have (später)?
   - Nicht benötigt (archivieren)?

4. **Gibt es Content?**
   - Sind Geschichten bereits geschrieben?
   - Wo werden sie gespeichert (Supabase, JSON, hardcoded)?

5. **Verständnis-Fragen?**
   - Sollen Fragen zu Geschichten gestellt werden?
   - Multiple Choice, Freitext, oder beides?

---

**Bei Fragen:** Siehe `active-deploy/lerndialoge-allgemein.md` (KI-Richtlinien) 🚀

**Status:** ⚠️ **WARTET AUF ANALYSE** (Blocker)
