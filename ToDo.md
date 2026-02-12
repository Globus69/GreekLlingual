# HellenicHorizons GreekLingua – Mehrsprachige UI (EN + RU + EL + DE) + Backend

> **Ziel:** UI-Sprache waehlbar (Englisch / Russisch / Griechisch / Deutsch). Lernziel-Sprache bleibt immer Neugriechisch.
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

## Phase 4: Dashboard UI-Texte vollstaendig in DB erfassen

### 24. ✅ Inventar: Alle hardcodierten UI-Texte der Main Page identifizieren (2026-02-09 00:30)
- Alle Dashboard-Komponenten durchgehen und noch nicht uebersetzte Strings auflisten
- Betrifft: DashboardHeader, StatsCard, ActionGrid, ModuleGrid, PerformanceHub, dashboard/page.tsx
- Ergebnis: Vollstaendige Liste aller fehlenden Keys mit EN- und RU-Text

### 25. ✅ SQL-INSERT: Fehlende Uebersetzungsschluessel in `ui_translations` einfuegen (2026-02-09)
- Fuer jeden identifizierten String einen Key definieren (z.B. `header.flag_tooltip_ru`)
- SQL-INSERT mit EN-Text und RU-Text in `ui_translations` Tabelle
- Datei: `supabase/insert_missing_dashboard_translations.sql`

### 26. ✅ DashboardHeader.tsx: Hardcodierte Tooltips durch t() ersetzen (2026-02-09)
- Flaggen-Button Tooltip: "Switch to Russian" / "Switch to English" → t('header.switch_to_ru') / t('header.switch_to_en')
- Sicherstellen dass Fallback-Keys in FALLBACK_EN ergaenzt werden

### 27. ✅ ActionGrid.tsx: Hardcodierte Toast-Nachrichten durch t() ersetzen (2026-02-09)
- 8 Toast-Messages (showToast-Aufrufe) durch t()-Aufrufe ersetzen
- Keys: `action_grid.toast_magic_round`, `action_grid.toast_comprehension`, etc.
- Fallback-Keys in FALLBACK_EN ergaenzen

### 28. ✅ ModuleGrid.tsx: Hardcodiertes Alert durch t() ersetzen (2026-02-09)
- Alert-Text "Opening module: " → t('modules.opening') + Modul-Name
- Fallback-Key in FALLBACK_EN ergaenzen

### 29. ✅ StatsCard.tsx: Stunden-Suffix "h" durch t() ersetzen (2026-02-09)
- "h" → t('stats.hours_suffix')
- Fallback-Key in FALLBACK_EN ergaenzen

### 30. ✅ FALLBACK_EN in useTranslation.ts aktualisieren + Build testen (2026-02-09)
- Alle neuen Keys aus Aufgaben 26-29 in FALLBACK_EN eintragen (EN + sinnvoller Default)
- Build testen (`npx next build`)
- CLAUDE.md aktualisieren

---

## Phase 5: Griechisch (el) als dritte UI-Sprache

### 31. ✅ Locale-Typ + LanguageContext auf 3 Sprachen erweitern (2026-02-09)
- `Locale = 'en' | 'ru' | 'el'` in `LanguageContext.tsx`
- `translationCache` und `fetchPromises` in `useTranslation.ts` um `el` erweitern
- CHECK-Constraint auf `preferred_locale` in DB anpassen (`'en', 'ru', 'el'`)
- CHECK-Constraint auf `lang` in `ui_translations` anpassen (`'en', 'ru', 'el'`)

### 32. ✅ FALLBACK_EL: Griechische Fallback-Uebersetzungen in useTranslation.ts (2026-02-09)
- Alle ~130 Keys ins Griechische uebersetzen
- Als `FALLBACK_EL` Objekt in `useTranslation.ts` einfuegen
- Fallback-Logik anpassen: `translations[key] || FALLBACK_EN[key]` → Locale-abhaengig

### 33. ✅ SQL: Griechische Uebersetzungen in ui_translations einfuegen (2026-02-09)
- SQL-Datei `supabase/insert_greek_translations.sql` erstellt
- Alle ~130 Keys mit `lang = 'el'` und griechischen Texten eingefuegt
- Idempotent via `ON CONFLICT (key, lang) DO UPDATE`
- CHECK-Constraint `lang` auf `('en', 'ru', 'el')` erweitert (kombiniert mit Aufgabe 38)

### 34. ✅ Login-Seite: 3-Sprachen-Auswahl (EN / RU / EL) (2026-02-09)
- EN/RU Toggle durch 3-Button-Auswahl ersetzt (EN / RU / EL)
- Griechische Flagge 🇬🇷 hinzugefuegt
- Hintergrund-Gradient fuer Griechisch definiert (cyan-blau Ton)
- Canvas-Partikel-Farbe fuer Griechisch definiert (Hue 190-220)
- Gradient Orbs fuer Griechisch angepasst
- Divider "or/или/ή" dreisprachig

### 35. ✅ DashboardHeader: Flaggen-Toggle fuer 3 Sprachen (2026-02-09)
- 2-Wege-Toggle (EN↔RU) durch 3-Wege-Toggle ersetzt (EN→RU→EL→EN)
- Flagge zeigt 🇬🇧 / 🇷🇺 / 🇬🇷 je nach aktiver Sprache
- Tooltip-Keys: `header.switch_to_el` hinzugefuegt

### 36. ✅ Admin-Seite: Flaggen-Toggle fuer 3 Sprachen (2026-02-09)
- Gleiche 3-Wege-Logik wie im DashboardHeader
- Hintergrund-Farbe fuer Griechisch (EL) definiert (griechisches Blau)
- Flaggen-Button Rahmenfarbe fuer EL angepasst (#0D6EFD)
- Header-Border und Background fuer EL angepasst

### 37. ✅ LanguageToast: Griechische Toast-Nachricht (2026-02-09)
- Toast fuer EL: "Η γλώσσα άλλαξε σε Ελληνικά." mit 🇬🇷
- Farbschema fuer EL-Toast definiert (blau-cyan)
- TOAST_COLORS Record fuer alle 3 Locales erstellt

### 38. ✅ SQL: preferred_locale CHECK-Constraint erweitern + Build testen (2026-02-09)
- `preferred_locale` CHECK auf `('en', 'ru', 'el')` erweitert (in insert_greek_translations.sql)
- `ui_translations.lang` CHECK auf `('en', 'ru', 'el')` erweitert
- `update_user_locale()` RPC auf 3 Sprachen erweitert
- Build getestet – erfolgreich ✅

---

## Phase 6: Deutsch (de) als vierte UI-Sprache

### 39. ✅ Locale-Typ + LanguageContext auf 4 Sprachen erweitern (2026-02-09)
- `Locale = 'en' | 'ru' | 'el' | 'de'` in `LanguageContext.tsx`
- `translationCache` und `fetchPromises` in `useTranslation.ts` um `de` erweitern
- `AuthContext.tsx` preferred_locale Typ um `'de'` erweitern

### 40. ✅ FALLBACK_DE: Deutsche Fallback-Uebersetzungen in useTranslation.ts (2026-02-09)
- Alle ~130 Keys ins Deutsche uebersetzt
- Als `FALLBACK_DE` Objekt in `useTranslation.ts` eingefuegt
- Fallback-Logik angepasst: `getFallback()` um `de` erweitert
- `header.switch_to_de` in FALLBACK_EN und FALLBACK_EL ergaenzt

### 41. ✅ SQL: Deutsche Uebersetzungen in ui_translations einfuegen (2026-02-09)
- SQL-Datei `supabase/insert_german_translations.sql` erstellt
- Alle ~130 Keys mit `lang = 'de'` und deutschen Texten eingefuegt
- Idempotent via `ON CONFLICT (key, lang) DO UPDATE`
- CHECK-Constraints auf `('en', 'ru', 'el', 'de')` erweitert

### 42. ✅ Login-Seite: 4-Sprachen-Auswahl (EN / RU / EL / DE) (2026-02-09)
- 3-Button-Auswahl durch 4-Button-Auswahl ersetzt (EN / RU / EL / DE)
- Deutsche Flagge 🇩🇪 hinzugefuegt
- Hintergrund-Gradient fuer Deutsch definiert (warmer Goldton #3d3010)
- Canvas-Partikel-Farbe fuer Deutsch definiert (Hue 35-55, gold/amber)
- Gradient Orbs fuer Deutsch angepasst (rgba(218, 165, 32))
- Verbindungslinien-Farbe fuer DE (218, 165, 32)
- Divider "or/или/ή/oder" viersprachig

### 43. ✅ DashboardHeader: Flaggen-Toggle fuer 4 Sprachen (2026-02-09)
- 3-Wege-Toggle durch 4-Wege-Toggle ersetzt (EN→RU→EL→DE→EN)
- Flagge zeigt 🇬🇧 / 🇷🇺 / 🇬🇷 / 🇩🇪 je nach aktiver Sprache
- Tooltip-Keys: `header.switch_to_de` hinzugefuegt

### 44. ✅ Admin-Seite: Flaggen-Toggle fuer 4 Sprachen (2026-02-09)
- Gleiche 4-Wege-Logik wie im DashboardHeader
- Hintergrund-Farbe fuer Deutsch (DE) definiert (warmer Goldton #2a2010)
- Flaggen-Button Rahmenfarbe fuer DE angepasst (rgba(218, 165, 32, 0.2))
- Label-Farbe fuer DE: #DAA520 (Goldgelb)

### 45. ✅ LanguageToast: Deutsche Toast-Nachricht (2026-02-09)
- Toast fuer DE: "Sprache auf Deutsch geändert." mit 🇩🇪
- Farbschema fuer DE-Toast definiert (gold/amber: bg rgba(50, 40, 10), border rgba(218, 165, 32))

### 46. ✅ SQL: CHECK-Constraints erweitern + Build testen (2026-02-09)
- `preferred_locale` CHECK auf `('en', 'ru', 'el', 'de')` erweitert
- `ui_translations.lang` CHECK auf `('en', 'ru', 'el', 'de')` erweitert
- `update_user_locale()` RPC auf 4 Sprachen erweitert
- Build getestet – erfolgreich ✅

---

## Phase 7: PIN-Management-System + WhatsApp-Benachrichtigungen

### 47. ⬜ Auto-PIN-Generierung bei User-Erstellung
- **Ziel:** Beim Anlegen eines neuen Users im Admin-Backend (StudentManagementDialog) automatisch eine zufällige 4-stellige PIN generieren
- **Implementierung:**
  - Funktion `generateRandomPin()` erstellen (Client-seitig)
  - Generiert zufällige 4-stellige Zahl (1000-9999)
  - Auto-Fill des PIN-Feldes beim Klick auf "Neuer Schüler"
  - Bereits vorhanden: 🎲 Button für manuelle Regenerierung (existiert für 6-stellig, muss auf 4-stellig angepasst werden)
- **Validierung:** siehe Aufgaben 48 + 49
- **Status:** ⬜ Offen

### 48. ⬜ Duplikat-Prüfung bei PIN-Vergabe
- **Ziel:** Sicherstellen, dass keine zwei User die gleiche PIN haben
- **Implementierung:**
  - Client-seitig: Vor dem Speichern prüfen ob `pin_4digit` bereits existiert (Supabase Query)
  - Falls Duplikat gefunden: Neue PIN generieren und erneut prüfen (max. 10 Versuche)
  - Server-seitig: UNIQUE Constraint auf `users.pin_4digit` Spalte in DB setzen
  - RPC-Funktion `create_student()` + `update_student()` anpassen: Duplikat-Check vor INSERT/UPDATE
- **Fehlermeldung:** "PIN bereits vergeben – neue PIN generiert"
- **Status:** ⬜ Offen

### 49. ⬜ Honeypot-PIN-Prüfung bei PIN-Vergabe
- **Ziel:** Verhindern, dass User PINs bekommen, die in der Honeypot-Liste sind
- **Verbotene PINs:** 0000, 1111, 2222, 3333, 4444, 5555, 6666, 7777, 8888, 9999, 1234, 4321, 1122, 2211, 5678 (15 PINs)
- **Implementierung:**
  - Client-seitig: Liste der 15 Honeypot-PINs als Konstante
  - Vor Speichern: Prüfen ob PIN in Honeypot-Liste → Falls ja: Neue PIN generieren
  - Server-seitig: RPC-Funktion prüft gegen `honeypot_pins` Tabelle
  - Bei Konflikt: `generate_safe_pin()` RPC-Funktion mit automatischer Retry-Logik
- **Fehlermeldung:** "PIN ungültig (Sicherheitsregel) – neue PIN generiert"
- **Status:** ⬜ Offen

### 50. ⬜ Admin: PIN neu generieren für bestehende User
- **Ziel:** Admin kann für einen bestehenden User eine neue PIN vergeben
- **Implementierung:**
  - Im StudentManagementDialog (Edit-Modus): 🎲 Button neben PIN-Feld
  - Klick generiert neue 4-stellige PIN (inkl. Duplikat- und Honeypot-Prüfung)
  - Neue PIN wird in Formular übernommen (nicht sofort gespeichert)
  - Admin kann vor Speichern prüfen/anpassen
  - Beim Speichern: `update_student()` RPC mit neuer PIN
- **Validierung:** Gleiche Checks wie bei Aufgaben 48 + 49
- **Bestätigung:** Toast-Nachricht "Neue PIN generiert: XXXX"
- **Status:** ⬜ Offen

### 51. ⬜ Admin: User entsperren (IP-Ban + Account-Lock)
- **Ziel:** Admin kann gebannte/gesperrte User entsperren
- **Option 1 – IP-Entsperrung:**
  - Button "IP entsperren" in StudentManagementDialog
  - Zeigt alle IPs die mit diesem User verbunden sind (aus `honeypot_log`)
  - Admin kann einzelne IPs aus `banned_ips` entfernen
  - RPC-Funktion `unban_user_ips(user_id)` erstellt
- **Option 2 – Account-Lock:**
  - Neues Feld `users.locked` (BOOLEAN, DEFAULT false)
  - Bei Honeypot-Versuch: User-Account sperren (`locked = true`)
  - Admin-Button "Account entsperren" setzt `locked = false`
  - Login prüft `locked` Flag (zusätzlich zu IP-Check)
- **UI:**
  - 🔓 Button nur sichtbar wenn User gesperrt ist
  - Status-Badge in User-Liste: "🔒 Gesperrt" (rot) wenn `locked = true` oder IP gebannt
- **Status:** ⬜ Offen

### 52. ⬜ WhatsApp-Benachrichtigung bei User-Sperrung
- **Ziel:** Wenn ein User durch Honeypot-PIN gesperrt wird, WhatsApp-Nachricht an Admin senden
- **Empfänger:** +35796120069 (Admin-Telefonnummer)
- **Nachricht-Inhalt:**
  ```
  🚨 Sicherheitsalarm – GreekLingua Dashboard

  User: [Name]
  PIN-Versuch: [PIN]
  IP-Adresse: [IP]
  Zeitpunkt: [Datum + Uhrzeit]
  Aktion: 24h IP-Ban + Account gesperrt
  ```
- **Implementierung:**
  - **Option A (bevorzugt):** Telegram Bot API statt WhatsApp (einfacher, keine Business-API nötig)
  - **Option B:** WhatsApp Business API (Twilio, WhatsApp Cloud API)
  - Server-seitige Integration: Edge Function oder RPC-Funktion mit HTTP-Request
  - Trigger: Nach `ban_ip()` in `verify_user_4digit_pin()` RPC
  - Fehlerbehandlung: Falls Nachricht fehlschlägt, trotzdem sperren (nur Log-Warnung)
- **Reminder:** In 5 Stunden an ToDo erinnern + Telegram vs. WhatsApp entscheiden
- **Status:** ⬜ Offen (Technologie-Entscheidung ausstehend)

### 53. ⬜ Admin-Telefonnummer in Datenbank speichern
- **Ziel:** Admin-User bekommt Telefonnummer-Feld für WhatsApp/Telegram-Benachrichtigungen
- **Implementierung:**
  - SQL-Migration: `users` Tabelle erweitern
    - Neues Feld `contact_phone` TEXT (nullable, für alle User)
    - Oder: Bestehendes `whatsapp` Feld auch für Admin nutzen
  - Admin-User Update: `contact_phone = '+35796120069'`
  - UI: Telefonnummer-Feld in StudentManagementDialog anzeigen
    - Für Studenten: Zeigt `whatsapp` Feld (bereits vorhanden)
    - Für Admin: Zeigt `contact_phone` / `whatsapp` Feld (editierbar)
  - RPC-Funktion `get_admin_contact()` für Benachrichtigungs-System
- **Anzeige:**
  - In User-Liste: Tel.Nr. als Spalte
  - In Edit-Dialog: Tel.Nr. als Eingabefeld (optional)
  - Format-Validierung: `+[Ländercode][Nummer]` (z.B. +35796120069)
- **Status:** ⬜ Offen

### 54. ⬜ ToDo.md aktualisiert mit Phase 7
- **Ziel:** Diese 7 neuen Aufgaben (47-53) in ToDo.md dokumentieren
- **Struktur:**
  - Phase 7: PIN-Management-System + WhatsApp-Benachrichtigungen
  - Jede Aufgabe mit Ziel, Implementierung, Status
  - Abhängigkeiten zwischen Aufgaben dokumentieren (47→48+49, 52→53)
- **Status:** ✅ Erledigt (2026-02-12)

---

## Legende
- ⬜ = offen
- 🔄 = in Arbeit
- ✅ = erledigt

---

## Hinweise
- Commit-Format: `YYYY-MM-DD HH:MM | Aufgabe X – Kurzbeschreibung`
- Griechisch = immer Antwortsprache (Schueler-Seite der Karten)
- `html lang` Attribut dynamisch setzen (en/ru/el/de)
- PIN wird IMMER gehasht gespeichert (bcrypt via pgcrypto)
- Index-Key Format: `"{level}-{difficulty}"` (z.B. `"A1-easy"`)
- Admin-Routen sind geschuetzt (Server- UND Client-seitig)
- Leistungsstufe wird automatisch bei Fortschritt angepasst
- **NEU:** 4-stellige PINs müssen Duplikat- + Honeypot-Check durchlaufen
- **NEU:** Benachrichtigungen bei Sicherheitsvorfällen (Telegram/WhatsApp)
