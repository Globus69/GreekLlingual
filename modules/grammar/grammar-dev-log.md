# Grammar Module – Development Log
**Projekt:** Hellenic Horizons – GreekLingua Dashboard

---

## 2026-02-15 – Initial Setup & Desktop Integration

### Was wurde gemacht?
1. **Desktop-Dashboard aktualisiert** (`src/app/dashboard/page.tsx`)
   - Import geändert: `GrammarDialog` → `GrammarDialogFSRS`
   - Dialog-Komponente aktualisiert auf FSRS-Version
   - Mode-Prop entfernt (FSRS-Version lädt alle Items standardmäßig)

2. **Module-Struktur erstellt** (`modules/grammar/`)
   - `README.md` – Vollständige Modul-Dokumentation
   - `grammar-todo.md` – Aufgabenliste (offen & erledigt)
   - `grammar-dev-log.md` – Dieses Dokument
   - Verzeichnis angelegt: `modules/grammar/`

3. **Komponente analysiert** (`grammar-dialog-fsrs.tsx`)
   - **Status:** Verwendet Mock-Daten (Zeilen 244-350)
   - **FSRS-6:** Vollständig implementiert
   - **TTS:** Auto-Play, Geschwindigkeitsregelung, Greek TTS
   - **Session Tracking:** RPC-Calls vorhanden
   - **UI:** Modern, Liquid Glass Design, Keyboard Shortcuts

### Erkenntnisse
- Mobile Version (`/m/page.tsx`) verwendet bereits `GrammarDialogFSRS` ✅
- Desktop Version verwendete alte `GrammarDialog` (jetzt aktualisiert) ✅
- Alte `GrammarDialog.tsx` kann potentiell depreciert werden
- Mock-Daten müssen durch echte DB-Integration ersetzt werden

### Nächste Schritte
1. **DB-Schema prüfen:** Gibt es `grammar_items` Tabelle?
2. **RPC-Funktionen:** `get_due_grammar_cards` implementieren
3. **Test-Daten:** `database/test-data/040_insert_test_grammar.sql` erweitern
4. **START.md aktualisieren:** Grammar-Modul hinzufügen

### Offene Fragen
- [ ] Ist `update_card_fsrs` RPC bereits universell für alle Kartentypen (vocab, phrases, grammar)?
- [ ] Welche FSRS-Felder sind in welcher Tabelle? (`student_progress`, `card_reviews`, oder direkt in `learning_items`?)
- [ ] Soll `GrammarDialog.tsx` (alte Version) gelöscht oder als Fallback behalten werden?

---

## 2026-02-15 (später) – Backend Integration & RPC Functions

### Was wurde gemacht?
1. **RPC-Funktionen erstellt** (`database/migrations/064_create_grammar_rpc_functions.sql`)
   - `get_due_grammar_cards(p_user_id, p_limit)` – Lädt fällige Grammar-Cards
   - `update_grammar_card_progress(...)` – Aktualisiert FSRS-Daten in `student_progress` (korrekt!)
   - **Fix:** FSRS-Daten werden jetzt pro User in `student_progress` gespeichert (nicht mehr in `learning_items`)

2. **Frontend aktualisiert** (`grammar-dialog-fsrs.tsx`)
   - `loadDueCards()` ruft jetzt `get_due_grammar_cards` RPC auf
   - `handleRating()` ruft jetzt `update_grammar_card_progress` RPC auf
   - Fallback auf Mock-Daten bei DB-Fehler beibehalten
   - Ausführliches Error-Handling und Logging

3. **Migration Guide erstellt** (`064_APPLY_GUIDE.md`)
   - Schritt-für-Schritt-Anleitung für Deployment
   - Test-Szenarien und erwartete Ergebnisse
   - Troubleshooting für bekannte Probleme
   - Rollback-Anleitung

### Erkenntnisse
- **Design-Fix:** FSRS-Daten in `learning_items` waren ein Problem (Multi-User Überschreibung)
- Neue RPC `update_grammar_card_progress` verwendet UPSERT auf `student_progress`
- Frontend hat jetzt robust Fallback auf Mock-Daten (offline-first)
- Migration ist abwärtskompatibel (alte `update_card_fsrs` bleibt bestehen)

### Nächste Schritte
1. Migration in Supabase ausführen (`064_create_grammar_rpc_functions.sql`)
2. Frontend deployen
3. End-to-End testen (Desktop + Mobile)
4. Performance monitoring (RPC-Call-Dauer, Error-Rate)

### Offene Fragen
- [ ] Soll `update_card_fsrs` (alte Funktion) auch gefixet werden, um `student_progress` zu nutzen?
- [ ] Brauchen wir Migration, um FSRS-Felder aus `learning_items` zu entfernen?
- [ ] Soll Mobile auch `get_due_grammar_cards` nutzen oder hat Mobile eigene Logik?

---

## Template für zukünftige Einträge

### YYYY-MM-DD – [Titel der Änderung]

#### Was wurde gemacht?
- Beschreibung der Änderungen

#### Erkenntnisse
- Learnings und Beobachtungen

#### Nächste Schritte
- Was als nächstes zu tun ist

#### Offene Fragen
- Ungeklärte Punkte
