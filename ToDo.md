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

### 2. ⬜ LanguageContext + Provider erstellen
- `src/context/LanguageContext.tsx` erstellen
- State: `locale` (en | ru), persistiert in `localStorage`
- `setLocale(lang)` Methode
- Provider in `layout.tsx` einbinden (innerhalb AuthProvider)

### 3. ⬜ `useTranslation` Hook + Supabase-Anbindung
- `src/lib/useTranslation.ts` erstellen
- Lädt alle Übersetzungen für aktive Sprache aus `ui_translations`
- Caching (nur einmal pro Sprachwechsel laden)
- Fallback-Texte (Englisch) falls Übersetzung fehlt
- `t('key')` Funktion zurückgeben

### 4. ⬜ Login-Seite mehrsprachig + Sprachauswahl-Dropdown
- Sprachauswahl (EN/RU) als Dropdown/Toggle im Login-Dialog
- Alle hardcodierten Texte durch `t('key')` ersetzen
- Sprache wird bei Login in localStorage + ggf. Supabase gespeichert

### 5. ⬜ Dashboard-Seite mehrsprachig
- `DashboardHeader.tsx` – alle Labels übersetzen
- `StatsCard.tsx` – Labels (Current Level, Vocabs, Learned, Today, Days)
- `dashboard/page.tsx` – Welcome-Text, Mastery-Box, Action-Tiles, alle Labels
- Action-Tile Labels (Magic Round, Quick Lesson, etc.)

### 6. ⬜ VocabularyDialog mehrsprachig
- `VocabularyDialog.tsx` – Alle Strings (Loading, Session beendet, Richtig/Falsch, etc.)
- `Flashcard.tsx` – Labels (ENGLISH→dynamisch, Click to flip, Hard/Good/Easy, etc.)
- Feld-Label "ENGLISH" dynamisch anpassen (→ "ENGLISH" bei EN, "АНГЛИЙСКИЙ" bei RU)
- "ΕΛΛΗΝΙΚΑ" bleibt immer gleich (Zielsprache)

### 7. ⬜ Restliche Komponenten mehrsprachig
- `GrammarDialog.tsx`
- `ComprehensionDialog.tsx`
- `ListeningDialog.tsx`
- `ActionGrid.tsx`, `ModuleGrid.tsx`, `PerformanceHub.tsx`

### 8. ⬜ `learning_items` Tabelle um Russisch erweitern
- Neue Spalte: `russian TEXT` (neben `english`)
- SQL-Migration erstellen
- VocabularyDialog: Kartenansicht zeigt je nach UI-Sprache EN oder RU als Frageseite
- Fallback auf `english` wenn `russian` leer ist

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
