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

### 11. ⬜ Admin-Authentifizierung absichern
- Admin-Login ueber Name + PIN (wie normaler Login)
- Rolle aus `users` Tabelle pruefen (`role = 'admin'`)
- AuthContext erweitern: `isAdmin` Flag
- Geschuetzte `/admin/*` Routen (Redirect zu Dashboard wenn kein Admin)
- Session-basierte Admin-Auth (nicht nur Client-Check)

### 12. ⬜ Admin-Hauptseite (Backend-Main-Page)
- Route: `/admin`
- Layout: Sidebar/Navigation mit Admin-Menue
- Sprachwahl-Switch EN/RU (selektiert DB-Abfrage-Sprache)
- Dashboard-Uebersicht: Anzahl Schueler, Lernfortschritt-Statistik
- Links zu: Schueler-Verwaltung, Inhalts-Verwaltung, Einstellungen
- Mehrsprachig (alle Texte via `t('admin.*')`)

### 13. ⬜ Auswahlliste Studienlevel (A1, A2, B1)
- Dropdown/Toggle in Admin-Seite und Schueler-Profil
- Werte: `A1` (Anfaenger), `A2` (Grundlagen), `B1` (Fortgeschritten)
- Gespeichert in `users.level`
- Beeinflusst welche `learning_items` angezeigt werden
- Filter-Logik: Items haben ebenfalls ein `level` Feld

### 14. ⬜ Auswahl Schwierigkeit (leicht, mittel, schwer)
- Dropdown/Toggle in Admin-Seite und Schueler-Profil
- Werte: `easy`, `medium`, `hard`
- Gespeichert in `users.difficulty`
- Beeinflusst Kartenauswahl und Sitzungslaenge
- `learning_items` Tabelle um `difficulty` Spalte erweitern

### 15. ⬜ Index-Key aus Kriterien bilden
- Zusammengesetzter Key als String: `"{level}-{difficulty}"` (z.B. `"A1-easy"`, `"B1-hard"`)
- Berechnet aus `users.level` + `users.difficulty`
- Gespeichert in `users.performance_index`
- Dient als Filter fuer `learning_items` Abfragen
- Automatische Aktualisierung bei Aenderung von Level oder Schwierigkeit

### 16. ⬜ Schueler-Leistungsstufe zuordnen
- Initiale Leistungsstufe bei Erstellung durch Admin festlegen
- Automatische Anpassung basierend auf Lernfortschritt:
  - Korrektquote > 80% ueber 50 Karten → Schwierigkeit erhoehen
  - Korrektquote < 40% ueber 50 Karten → Schwierigkeit senken
- Leistungsstufe aendert `performance_index` automatisch
- Verlauf der Aenderungen loggen (optional: `performance_log` Tabelle)

### 17. ⬜ Inhalte basierend auf Leistungsstufe filtern
- `learning_items` Query: `WHERE level = user.level AND difficulty = user.difficulty`
- Fallback: Wenn keine Items fuer aktuelle Stufe → naechst niedrigere Stufe
- Alle 4 Dialoge (Vocabulary, Grammar, Comprehension, Listening) anpassen
- Admin kann Items einem Level + Schwierigkeit zuordnen

### 18. ⬜ User-Zuordnung via Name + 6-stelliger PIN
- Login-Seite: Name-Feld + 6-stelliges PIN-Feld (statt Email + PIN)
- PIN-Eingabe als 6 einzelne Ziffernfelder (PIN-Pad-Stil)
- Validierung: Name in `users` Tabelle suchen, PIN-Hash vergleichen
- Personalisierte Inhalte nach Login (basierend auf User-Profil)
- AuthContext anpassen: User-Objekt mit Level + Difficulty

### 19. ⬜ Schueler-DB-Verwaltung im Admin-Backend
- CRUD-Operationen fuer Schueler (Create, Read, Update, Delete)
- Schueler-Liste mit Suchfunktion
- Schueler-Detail: Name, PIN (neu setzen), Email, WhatsApp, Level, Schwierigkeit
- Fortschritts-Uebersicht pro Schueler
- PIN generieren: Admin kann neuen 6-stelligen PIN fuer Schueler erstellen
- Export-Funktion (CSV) fuer Schueler-Daten

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
