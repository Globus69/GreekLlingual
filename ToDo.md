# HellenicHorizons GreekLingua – Mehrsprachige UI (EN + RU)

> **Ziel:** UI-Sprache wählbar (Englisch / Russisch). Lernziel-Sprache bleibt immer Neugriechisch.
> **Regel:** Hardcodierte Texte → Supabase-Tabelle `ui_translations`. Sprachauswahl im Login-Dialog.

---

## Aufgaben

### 1. ✅ Supabase-Tabelle `ui_translations` anlegen (2026-02-08)
- SQL-Migrationsdatei erstellen: `supabase/create_ui_translations.sql`
- Tabelle: `ui_translations (id, key, lang, value, context, created_at)`
- Alle bestehenden hardcodierten UI-Texte (EN + DE) inventarisieren
- Englische Texte einfügen
- Russische Übersetzungen einfügen
- RLS-Policy: Leserechte für authentifizierte + anon Nutzer

### 2. ✅ LanguageContext + Provider erstellen (2026-02-08)
- `src/context/LanguageContext.tsx` erstellen
- State: `locale` (en | ru), persistiert in `localStorage`
- `setLocale(lang)` Methode
- Provider in `layout.tsx` einbinden (innerhalb AuthProvider)

### 3. ✅ `useTranslation` Hook + Supabase-Anbindung (2026-02-08)
- `src/lib/useTranslation.ts` erstellen
- Lädt alle Übersetzungen für aktive Sprache aus `ui_translations`
- Caching (nur einmal pro Sprachwechsel laden)
- Fallback-Texte (Englisch) falls Übersetzung fehlt
- `t('key')` Funktion zurückgeben

### 4. ✅ Login-Seite mehrsprachig + Sprachauswahl-Dropdown (2026-02-08)
- Sprachauswahl (EN/RU) als Toggle-Buttons im Login-Dialog (oben rechts)
- Alle hardcodierten Texte durch `t('key')` ersetzt (title, subtitle, placeholders, buttons, error, biometric)
- Sprache wird bei Auswahl in localStorage gespeichert (via LanguageContext)

### 5. ✅ Dashboard-Seite mehrsprachig (2026-02-08)
- `DashboardHeader.tsx` – Logout-Button uebersetzt (`header.logout`)
- `StatsCard.tsx` – Labels uebersetzt (Current Level, Vocabs, Learned, Today, Days)
- `dashboard/page.tsx` – Welcome-Text, Mastery-Box (6 Labels), alle 16 Action-Tiles uebersetzt
- Loading-Screens uebersetzt (Authenticating, Loading)

### 6. ✅ VocabularyDialog mehrsprachig (2026-02-08)
- `VocabularyDialog.tsx` – Alle Strings uebersetzt (Loading, Session, Richtig/Falsch, Mode-Titel, Buttons)
- `Flashcard.tsx` – Labels uebersetzt (ENGLISH dynamisch, Click to flip, Hard/Good/Easy, Audio, Restart, Cancel)
- Feld-Label "ENGLISH" dynamisch via `flashcard.label_source` (EN: "ENGLISH", RU: "АНГЛИЙСКИЙ")
- "ΕΛΛΗΝΙΚΑ" bleibt immer gleich (Zielsprache)

### 7. ✅ Restliche Komponenten mehrsprachig (2026-02-08)
- `GrammarDialog.tsx` – Loading, Login, NoItems, Error, Summary, Mode-Titel, Buttons uebersetzt
- `ComprehensionDialog.tsx` – Loading, Login, NoItems, Error, Summary, Mode-Titel, Buttons uebersetzt
- `ListeningDialog.tsx` – Loading, Login, NoItems, Error, Summary, Mode-Titel, Audio, Feedback uebersetzt
- `ActionGrid.tsx` – 9 Button-Labels uebersetzt (`action_grid.*`)
- `ModuleGrid.tsx` – 8 Modul-Titel und Subtitel uebersetzt (`modules.*`)
- `PerformanceHub.tsx` – Labels, Wochentage, Stats uebersetzt (`perf.*`)

### 8. ✅ `learning_items` Tabelle um Russisch erweitern (2026-02-08)
- SQL-Migration `supabase/alter_learning_items_add_russian.sql` erstellt
- `LearningItem` Interface in allen 4 Dialogen um `russian?: string` erweitert
- VocabularyDialog, GrammarDialog, ComprehensionDialog: Kartenansicht zeigt je nach UI-Sprache EN oder RU
- Fallback auf `english` wenn `russian` leer ist
- Fallback-Daten in allen Dialogen um russische Uebersetzungen ergaenzt

---

## Legende
- ⬜ = offen
- 🔄 = in Arbeit
- ✅ = erledigt

---

## Hinweise
- Commit-Format: `YYYY-MM-DD HH:MM | Aufgabe X – Kurzbeschreibung`
- Griechisch = immer Antwortsprache (Schüler-Seite der Karten)
- `html lang` Attribut dynamisch setzen (en/ru)
