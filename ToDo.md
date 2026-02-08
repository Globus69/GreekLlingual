# HellenicHorizons GreekLingua – Mehrsprachige UI (EN + RU) + Backend

> **Ziel:** UI-Sprache waehlbar (Englisch / Russisch). Lernziel-Sprache bleibt immer Neugriechisch.
> **Regel:** Hardcodierte Texte → Supabase-Tabelle `ui_translations`. Sprachauswahl im Login-Dialog.
> **Backend:** Admin-Bereich fuer Inhaltsverwaltung, Schueler-Management, Leistungsstufen.

---

## Phase 1: Mehrsprachige UI (abgeschlossen)

### 1. ✅ Supabase-Tabelle `ui_translations` anlegen (2026-02-08)
- SQL-Migrationsdatei erstellen: `supabase/create_ui_translations.sql`
- Tabelle: `ui_translations (id, key, lang, value, context, created_at)`
- Alle bestehenden hardcodierten UI-Texte (EN + DE) inventarisieren
- Englische Texte einfuegen
- Russische Uebersetzungen einfuegen
- RLS-Policy: Leserechte fuer authentifizierte + anon Nutzer

### 2. ✅ LanguageContext + Provider erstellen (2026-02-08)
- `src/context/LanguageContext.tsx` erstellen
- State: `locale` (en | ru), persistiert in `localStorage`
- `setLocale(lang)` Methode
- Provider in `layout.tsx` einbinden (innerhalb AuthProvider)

### 3. ✅ `useTranslation` Hook + Supabase-Anbindung (2026-02-08)
- `src/lib/useTranslation.ts` erstellen
- Laedt alle Uebersetzungen fuer aktive Sprache aus `ui_translations`
- Caching (nur einmal pro Sprachwechsel laden)
- Fallback-Texte (Englisch) falls Uebersetzung fehlt
- `t('key')` Funktion zurueckgeben

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

## Phase 2: Admin-Backend + Schueler-Management

### 9. ✅ Admin-Button im Dashboard-Header (2026-02-08)
- Button "Admin" oben rechts neben Logout im DashboardHeader
- Linkt zur Admin-Backend-Seite (`/admin`)
- Nur sichtbar wenn User Admin-Rolle hat (`isAdmin` aus AuthContext)
- Mehrsprachig (`header.admin`)
- Admin-Seite mit Zugriffskontrolle, Statistik-Karten, Navigation
- Sprachwahl EN/RU in Admin-Header

### 10. ✅ User-Tabelle erstellen (2026-02-08)
- SQL-Migration: `supabase/create_users_table.sql`
- Bestehende `users` Tabelle erweitert um: `name`, `pin_hash`, `whatsapp`, `role`, `level`, `difficulty`, `performance_index`
- PIN als bcrypt-Hash via pgcrypto (`crypt()` + `gen_salt('bf')`)
- RLS-Policies: Admin full access, Student read own, Anon read for login
- Trigger: `performance_index` automatisch aktualisiert bei Level/Difficulty-Aenderung
- Hilfsfunktion `verify_user_pin()` fuer Server-seitige PIN-Validierung
- Admin-User angelegt (Name: Admin, PIN: 1234, bcrypt-gehasht)

### 11. ✅ Admin-Authentifizierung absichern (erledigt 2026-02-08)
- Admin-Login ueber Name + PIN (wie normaler Login)
- Rolle aus `users` Tabelle pruefen (`role = 'admin'`)
- AuthContext erweitern: `isAdmin` Flag
- Geschuetzte `/admin/*` Routen (Redirect zu Dashboard wenn kein Admin)
- Session-basierte Admin-Auth (nicht nur Client-Check)
- Login-Kette: 1) Supabase verify_user_pin (bcrypt) → 2) Supabase direkt → 3) Lokaler Fallback
- Session-Timeout: 24 Stunden mit Timestamp-Pruefung

### 12. ✅ Schueler-Verwaltungs-Dialog (Modal/Component) im Backend (erledigt 2026-02-08 22:30)
- Funktionen: Neuer Schueler, Bearbeiten, Loeschen (CRUD)
- Felder anzeigen/aendern: Name, Email, WhatsApp, PIN (6-stellig, editierbar)
- Aktueller Leistungsstand anzeigen + editierbar:
  - Level: RadioButtons A1 / A2 / B1 / B2
  - Schwierigkeit: RadioButtons easy / middle / hard
- Kombinierter Index-Key automatisch gebildet (z.B. "A2-middle")
- Schueler-Liste mit Suchfunktion im Admin-Bereich
- Supabase CRUD-Operationen gegen `users` Tabelle

### 13. ✅ Sprachwechsel-Hintergrundfarbe im Backend (erledigt 2026-02-08)
- Bei Sprachwechsel (EN ↔ RU) im Backend-Bereich:
  - Hintergrundfarbe links oben aendert sich dezent
  - z.B. hellgrau → hellblau oder Flaggen-Farbe-Touch

### 14. ✅ Flaggen-Anzeige rechts oben (2026-02-08)
- Rechts oben (neben Admin-Logout):
  - Aktuelle Sprache als kleine Flagge anzeigen
  - Standard: Englisch → kleine GB-Flagge (🇬🇧)
  - Russisch → kleine russische Flagge (🇷🇺)
  - Flaggen dezent (ca. 22 px), nicht dominant
  - Im DashboardHeader UND Admin-Header implementiert

### 15. ✅ Flaggen-Klick wechselt Backend-Sprache (2026-02-08)
- Klick auf Flagge wechselt die Sprache (Toggle EN ↔ RU)
- Speichert in localStorage via LanguageContext
- Wechselt Locale sofort, alle Texte aktualisieren sich
- Admin-Header: Flaggen-Farbe passt sich an (EN=blau, RU=rot)
- Dashboard-Header: Hover-Effekt mit Scale-Animation

### 16. ✅ Schueler-Leistungsstufe zuordnen (2026-02-08)
- Initiale Leistungsstufe bei Erstellung durch Admin festlegen
- Automatische Anpassung basierend auf Lernfortschritt:
  - Korrektquote > 80% ueber 50 Karten → Schwierigkeit erhoehen
  - Korrektquote < 40% ueber 50 Karten → Schwierigkeit senken
- Leistungsstufe aendert `performance_index` automatisch
- Verlauf der Aenderungen in `performance_log` Tabelle geloggt
- `evaluate_student_performance()` RPC-Funktion erstellt
- `get_student_stats()` RPC-Funktion fuer Admin-Dashboard erstellt
- `usePerformanceEvaluation` Hook in alle 4 Lern-Dialoge integriert
- Performance-Nachricht nach Session-Abschluss angezeigt

### 17. ✅ Inhalte basierend auf Leistungsstufe filtern (2026-02-08)
- SQL-Migration: `learning_items` um `level` + `difficulty` Spalten erweitert
- RPC-Funktion `get_learning_items_for_student()` mit 3-stufigem Fallback
- RPC-Funktion `assign_item_level()` fuer Admin
- Alle 4 Dialoge: RPC-basierte Filterung (Strategy 1) mit direkter Query als Fallback (Strategy 2)
- `LearningItem` Interface um `level?` + `difficulty?` erweitert

### 18. ✅ User-Zuordnung via Name + 6-stelliger PIN (2026-02-08)
- Login-Seite: PIN-Eingabe als 6 einzelne Ziffernfelder (PIN-Pad-Stil)
- Auto-Focus auf naechstes Feld bei Eingabe
- Backspace springt zurueck zum vorherigen Feld
- Paste-Support: 6-stelliger PIN kann eingefuegt werden
- Visuelle Hervorhebung ausgefuellter Felder (blauer Rand)
- AuthContext hat Level + Difficulty bereits im User-Objekt

### 19. ✅ Schueler-DB-Verwaltung im Admin-Backend (2026-02-08)
- Fortschritts-Uebersicht pro Schueler (klappbar via 📊 Button)
  - Zeigt: Attempts, Correct Rate (farbcodiert), Learned/Practiced, Last Active
  - Nutzt `get_student_stats()` RPC-Funktion
- PIN-Generator: 🎲 Button generiert zufaelligen 6-stelligen PIN
- CSV-Export: 📥 CSV Button exportiert alle Schueler-Daten
  - Felder: Name, Email, WhatsApp, Level, Difficulty, Index-Key
  - UTF-8 BOM fuer korrekte Umlaute in Excel

---

## Phase 3: Sprachpersistenz + UX-Verbesserungen

### 20. ✅ Sprache aus Anmelde-Dialog dauerhaft fuer gesamte Session / App beibehalten (2026-02-08 23:45)
- Sprachauswahl im Login-Dialog wird in localStorage gespeichert (bereits via LanguageContext)
- Pruefen: Sprache bleibt nach Login erhalten (Login → Dashboard → Dialoge → Admin)
- Optional: Sprache auch im User-Profil in Supabase speichern (`preferred_locale` Spalte)
- Beim Login: Sprache aus User-Profil laden, falls vorhanden

### 21. ✅ Auf Frontend-Mainpage: Sprachwechsel-Option hinzufuegen (2026-02-08 23:50)
- Dashboard-Seite: Sprachwechsel-Button/Flaggen bereits im Header vorhanden
- Pruefen: Flaggen-Toggle funktioniert auf allen Seiten (Dashboard, Admin, Dialoge)
- Falls fehlend: Sprachwechsel-Option auf weiteren Seiten ergaenzen

### 22. ✅ Bei jeder Sprachaenderung alle UI-Texte sofort aktualisieren (2026-02-08 23:52)
- Alle Komponenten nutzen `useTranslation()` Hook (reaktiv auf Locale-Aenderung)
- Pruefen: Sprachwechsel aktualisiert sofort alle Texte ohne Seitenreload
- Falls DB-Texte sprachabhaengig: Cache invalidieren und neu laden
- Sicherstellen: Kein Flackern oder verzoegertes Laden bei Sprachwechsel

### 23. ✅ Bei Sprachwechsel kurzes Toast/Pop-up anzeigen (2026-02-08 23:55)
- Toast-Nachricht in der neu aktiven Sprache:
  - EN: "Language changed to English."
  - RU: "Язык изменён на Русский."
- Toast erscheint fuer 2-3 Sekunden, verschwindet dann automatisch
- Position: oben mittig oder unten mittig
- Dezentes Design passend zum Glasmorphismus-Stil

---

## Legende
- ⬜ = offen
- 🔄 = in Arbeit
- ✅ = erledigt

---

## Hinweise
- Commit-Format: `YYYY-MM-DD HH:MM | Aufgabe X – Kurzbeschreibung`
- Griechisch = immer Antwortsprache (Schueler-Seite der Karten)
- `html lang` Attribut dynamisch setzen (en/ru)
- PIN wird IMMER gehasht gespeichert (SHA-256 oder bcrypt)
- Index-Key Format: `"{level}-{difficulty}"` (z.B. `"A1-easy"`)
- Admin-Routen sind geschuetzt (Server- UND Client-seitig)
- Leistungsstufe wird automatisch bei Fortschritt angepasst
