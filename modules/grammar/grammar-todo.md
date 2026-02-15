# Grammar Module – TODO
**Letztes Update:** 15. Februar 2026

## 🔴 Kritisch / Blocker

### Backend-Integration
- [ ] **DB-Schema prüfen:** Gibt es `grammar_items` Tabelle oder sind Grammar-Items in `learning_items` mit `type='grammar'`?
- [ ] **RPC-Funktionen implementieren:**
  - [ ] `get_due_grammar_cards(p_user_id, p_limit)` – Lädt fällige Grammar-Cards
  - [ ] `update_card_fsrs(...)` – Aktualisiert FSRS-Parameter (existiert bereits?)
  - [ ] `start_learning_session(...)` – Session-Tracking Start
  - [ ] `end_learning_session(...)` – Session-Tracking Ende
- [ ] **Mock-Daten ersetzen:**
  - [ ] `grammar-dialog-fsrs.tsx` Zeile 244-350: Mock-Daten durch echte RPC-Calls ersetzen
  - [ ] Fallback auf Mock-Daten bei DB-Fehler beibehalten

### FSRS-Felder in DB
- [ ] **Prüfe FSRS-Felder in `student_progress` oder `card_reviews`:**
  - `fsrs_difficulty` (float)
  - `fsrs_stability` (float)
  - `fsrs_due` (timestamp)
  - `fsrs_state` (enum: 'new', 'learning', 'review', 'relearning')
  - `fsrs_reps` (int)
  - `fsrs_lapses` (int)
  - `fsrs_last_review` (timestamp)

## 🟡 Wichtig (High Priority)

### Content-Management
- [ ] **Admin-Interface für Grammar:**
  - [ ] Create-Funktion: Neue Grammar-Rules hinzufügen
  - [ ] Edit-Funktion: Bestehende Rules bearbeiten
  - [ ] Delete-Funktion: Rules löschen (mit Confirmation)
  - [ ] Bulk-Import: CSV/JSON-Import für Grammar-Daten
- [ ] **Test-Daten erweitern:**
  - [ ] `database/test-data/040_insert_test_grammar.sql` prüfen und erweitern
  - [ ] Mindestens 20-30 Grammar-Rules für A1-B1 Levels

### Filterung & Kategorisierung
- [ ] **Level-Filter implementieren:**
  - [ ] A1 (Anfänger)
  - [ ] A2 (Elementar)
  - [ ] B1 (Mittelstufe)
  - [ ] B2 (Fortgeschritten)
- [ ] **Schwierigkeits-Filter:**
  - [ ] Easy (einfach)
  - [ ] Medium (mittel)
  - [ ] Hard (schwer)
- [ ] **Themen-Filter:**
  - [ ] Verben (Conjugations)
  - [ ] Artikel (Articles)
  - [ ] Fälle (Cases: Nominativ, Genitiv, Akkusativ, Vokativ)
  - [ ] Pronomen (Pronouns)
  - [ ] Adjektive (Adjectives)
  - [ ] Zeiten (Tenses)

### UI-Verbesserungen
- [ ] **Mode-Auswahl hinzufügen:**
  - [ ] "Review All" (alle Grammar-Rules)
  - [ ] "Due Today" (fällige Rules)
  - [ ] "Weak Cards" (schwierige Rules mit niedrigem ease_factor)
  - [ ] Mode-Prop in `GrammarDialogFSRS` akzeptieren
- [ ] **Statistiken erweitern:**
  - [ ] Fortschritt pro Grammatik-Kategorie
  - [ ] "Schwächste Bereiche" anzeigen
  - [ ] Session-History mit Datum/Zeit

## 🟢 Nice-to-have (Low Priority)

### Advanced Features
- [ ] **Beispiel-Sätze erweitern:**
  - [ ] Mehrere Beispiele pro Grammar-Rule
  - [ ] Beispiele mit Audio-Files
  - [ ] Beispiele mit Bildern/Illustrationen
- [ ] **Gamification:**
  - [ ] Achievements für Grammar-Mastery
  - [ ] Leaderboards für Grammar-Fortschritt
  - [ ] Badges für bestimmte Grammar-Kategorien
- [ ] **Export-Funktionen:**
  - [ ] PDF-Export von Grammar-Rules
  - [ ] Anki-Export (APKG-Format)
  - [ ] JSON-Export für Backup

### Performance
- [ ] **Caching implementieren:**
  - [ ] LocalStorage-Cache für Grammar-Rules (offline-first)
  - [ ] Service Worker für offline-Funktionalität
  - [ ] IndexedDB für größere Datenmengen
- [ ] **Lazy Loading:**
  - [ ] Lazy Load von Audio-Dateien
  - [ ] Pagination für große Grammar-Sets

### Accessibility
- [ ] **Screen Reader Support verbessern:**
  - [ ] ARIA-Labels für alle interaktiven Elemente
  - [ ] Keyboard-Navigation testen
  - [ ] High-Contrast-Mode unterstützen
- [ ] **i18n erweitern:**
  - [ ] Mehr Sprachen (Deutsch, Französisch, Spanisch)
  - [ ] RTL-Support (Arabisch, Hebräisch)

## ✅ Erledigt

- [x] Desktop-Dashboard-Integration (15.02.2026)
- [x] Mobile-Dashboard-Integration (bereits vorhanden)
- [x] FSRS-6 Algorithmus implementiert
- [x] TTS mit Auto-Play und Geschwindigkeitsregelung
- [x] Session-Tracking (RPC-Calls vorhanden)
- [x] Streak-System-Integration
- [x] Keyboard Shortcuts (1-4, Space, A)
- [x] Toast-Benachrichtigungen
- [x] Offline-Detection
- [x] Module-Dokumentation (README.md, TODO.md)

## Notizen

- **Abgrenzung zu Daily Phrases:** Grammar sind isolierte Regeln, Daily Phrases sind vollständige Sätze
- **Abgrenzung zu Vocabulary:** Grammar sind Regeln/Muster, Vocabulary sind Einzelwörter
- **Naming Convention:** Alle Dateien mit `grammar-` Prefix, kebab-case
