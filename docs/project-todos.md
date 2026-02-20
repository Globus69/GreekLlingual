# HellenicHorizons – GreekLingua Dashboard  
Zentrale TODO-Liste  
Stand: 20. Februar 2026

**Regel**: Alle neuen TODOs landen nur noch hier.  
Alte TODO-Kommentare im Code werden nach Migration entfernt oder mit Datum + [DONE] markiert.

## Prioritäten

### 🔥 Prio 1 – Jetzt oder bald (High)
- [ ]  ### Due Cards Today Modul
**Status:** ⚠️ in Planung (nur Platzhalter vorhanden)  
**Priorität:** 🟡 Hoch (Kernmodul für Mobile / tägliches Review)  
**Geschätzter Aufwand:** 8–13 Stunden (ohne Tests)  
**Letzte Notiz:** 14.02.2026

**Wichtigster nächster Schritt:**
- [ ] Phase 2: Datenbank – RPC-Funktion `get_due_cards_today` erstellen & testen (1–2 h)  
  → Filter: next_review < NOW()  
  → Test-Query in Supabase: SELECT * FROM get_due_cards_today('<user-id>', 10);

**Danach (nach RPC):**
- [ ] Phase 3: DueCardsDialog.tsx bauen (3–5 h) – Basis: VocabularyDialog.tsx kopieren  
- [ ] SRS-Integration (SM2 aus lib/sm2.ts) & Progress-Speichern

**Offene Fragen (bitte beantworte, wenn du magst):**
1. Ist Due Cards Today wirklich MVP-kritisch (tägliches Review)?
2. Soll es Swipe-Gesten von Anfang an geben oder erst später?
3. Wie viele Karten pro Session maximal? (z. B. 10–20)
4. Multi-Language: Welche 4 Locales zuerst? (EN, EL, RU, DE?)

**Referenz:** modules/due-cards-today/todo.md (detaillierter Plan – wird nach Migration archiviert/gelöscht)

### Stats & Admin-Content
**Status:** ⚠️ offen (kleine, aber wichtige Verbesserungen)  
**Priorität:** 🟡 Mittel bis Hoch (Stats beeinflussen User-Experience, Duplikat-Check verhindert Datenmüll)  
**Geschätzter Aufwand:** 1–2 Stunden insgesamt  
**Letzte Notiz:** 20.02.2026

**Offene Punkte:**
- [ ] Streak-Berechnung aus DB holen statt hardcoded (src/hooks/use-stats-data.ts Zeile 181)  
  → Aktuell: Hardcoded Logik → Ziel: Supabase-Query mit next_review / last_review  
- [ ] Duplicate-Check für multilingual_content implementieren (src/components/admin/ContentModal.tsx Zeile 98)  
  → API-Call vor Insert: SELECT COUNT(*) WHERE content = ? AND lang = ?

**Empfohlener nächster Schritt:**
- [ ] Zuerst Streak-DB-Query bauen (1 h) – beeinflusst User-Dashboard direkt
- [ ] Dann Duplikat-Check (30–60 min) – verhindert Admin-Fehler

**Referenz:** src/hooks/use-stats-data.ts + src/components/admin/ContentModal.tsx

### ⚡ Prio 2 – Bald machen (Medium)
### Daily Phrases Modul
**Status:** 🟡 in Arbeit – Phase 4 fast abgeschlossen (91–100 %)  
**Priorität:** 🟡 Hoch (tägliches Lernen, Kern-Feature)  
**Geschätzter Restaufwand:** 1–3 Stunden (Accessibility + Testing)  
**Letzte Notiz:** 15.02.2026

**Aktueller Stand (kurz):**
- FSRS-6 Core Library vollständig (scheduler, types, tests)  
- VocabularyDialogFSRS.tsx mit FSRS-Integration, Swipe, Progress, TTS & Speed-Toggle  
- DB-Schema + RPC-Funktionen (get_due_cards_fsrs, update_card_fsrs) erweitert  
- Auto-Play, Speed-Control (🐢 0.6x / ▶️ 0.9x / 🐇 1.2x), localStorage-Persistence  

**Wichtigste offene Schritte (Rest von Phase 4):**
- [ ] Accessibility final verbessern (aria-live, keyboard, screen-reader) – 30–60 min  
- [ ] Integration-Testing (alle Features zusammen) – 1–2 h  
- [ ] Mobile-PWA-Optimierung (falls nötig)  

**Offene Fragen (bitte beantworte, wenn du magst):**
1. Ist Daily Phrases für dich aktuell höher priorisiert als Short Stories?  
2. TTS-Speed-Toggle reicht so (0.6/0.9/1.2) oder weitere Stufen?  
3. Auto-Play standardmäßig an oder aus?  
4. Möchtest du Analytics für Daily Phrases (z. B. Retention-Rate im Dashboard)?

**Referenz:** modules/daily-phrases/daily-phrases-dev-log.md (detaillierter Log – wird nach Abschluss archiviert)
- [ ] Mobile E2E-Tests erweitern (tests/mobile/e2e.spec.ts – 9 Treffer)
- [ ] Short-Stories-Modul: offene Punkte klären (modules/short-stories/todo.md – 7 Treffer)
- [ ] Due-Cards-Today: TODOs übertragen & prüfen (modules/due-cards-today/todo.md – 7 Treffer)

### Short Stories Modul
**Status:** ⚠️ **Blockiert – wartet auf Analyse**  
**Priorität:** 🟢 Mittel (Nice-to-have, nicht MVP-kritisch)  
**Geschätzter Aufwand:** 1,5–14,5 Stunden (abhängig von Analyse)  
**Letzte Notiz:** 14.02.2026

**Offene Entscheidung (Blocker):**
- [ ] Analyse durchführen: Was ist bereits implementiert? (Phase 1: 1–2 h)
  → Ordner `modules/short-stories/` öffnen, Dateien lesen, Struktur verstehen
  → Szenario festlegen: A (fertig), B (teilweise), C (neu), D (archivieren)

**Kritische nächste Schritte (nach Analyse):**
- [ ] README.md im Modul erstellen (Beschreibung + Status)
- [ ] Entscheiden: integrieren, migrieren, neu bauen oder archivieren?

**Offene Fragen (bitte beantworte, wenn du kannst):**
1. Ist Short Stories für dich noch relevant? (Leseverständnis? Kultur? Nice-to-have?)
2. Soll es Mobile-First werden oder erst später?
3. Gibt es schon Content (Geschichten in Supabase/JSON)?
4. Verständnisfragen + Audio geplant?

### Mobile Playwright E2E-Tests (e2e.spec.ts)
**Status:** ⚠️ skizziert – viele Tests noch zu schreiben  
**Priorität:** 🟡 Mittel (sichert Mobile-Qualität, aber nicht Blocker)  
**Aufwand:** 3–6 Stunden (je nach Abdeckung)  
**Letzte Notiz:** 20.02.2026

**Offene Punkte (aus e2e.spec.ts):**
- [ ] Practice Modes Mobile Tests implementieren (nach /m/practice-modes existiert)  
  → Item-Klick → Bottom Sheet  
  → Matching-Game-Interaktion
- [ ] Vocabulary Mobile Tests implementieren (nach /m/vocabulary existiert)  
  → Card visibility, flip, rating buttons

**Empfohlener nächster Schritt:**
- [ ] Tests für existierende Routes priorisieren (Dashboard, Login, Vocabulary)  
- [ ] Agent 1 & 2 abwarten → dann Tests erweitern

**Referenz:** tests/mobile/e2e.spec.ts (Zeilen 404–443)

**Referenz:** modules/short-stories/todo.md (detaillierter Plan – wird nach Migration gelöscht/archiviert)

### 🌱 Prio 3 – Kann warten (Low)

### Mobile E2E-Tests (Playwright)
**Status:** ⚠️ Platzhalter – Tests teilweise skizziert, viele noch zu implementieren  
**Priorität:** 🟡 Mittel bis Hoch (sichert Mobile-First-Qualität langfristig)  
**Geschätzter Aufwand:** 2–5 Stunden (je nach Abdeckung)  
**Letzte Notiz:** 18.02.2026

**Wichtigste offene Punkte (aus e2e.spec.ts):**
- [ ] Practice Modes Mobile Tests schreiben (9 Zeilen)  
  → z. B. Item-Klick → Bottom Sheet öffnet  
  → Matching-Game-Interaktion testen  
  → Implement after /m/practice-modes existiert
- [ ] Vocabulary Mobile Tests schreiben (5 Zeilen)  
  → Card visibility, flip, rating buttons  
  → Implement after /m/vocabulary existiert

**Empfohlener nächster Schritt:**
- [ ] Tests für bereits existierende Routes priorisieren (z. B. Dashboard, Vocabulary)  
- [ ] Agent 1 & 2 abwarten → dann Playwright-Skripte erweitern

**Referenz:** tests/mobile/e2e.spec.ts (Zeilen 404–443)
- [ ] Daily-Phrases Dev-Log bereinigen (modules/daily-phrases/daily-phrases-dev-log.md – 7 Treffer)
- [ ] Security-Audit nachholen (docs/security/AUDIT-REPORT.md – 9 Treffer)
- [ ] Design-Audit finalisieren (docs/DESIGN-AUDIT-170225.md – 6 Treffer)

## Erledigt / Archiviert (seit letztem Cleanup)
- [x] Root komplett bereinigt (71+ .md-Dateien archiviert) – 20.02.2026  
- [x] TypeScript-Fehler in import/route.ts gefixt – 20.02.2026  

## Wie wir weitermachen
1. grep -r TODO/FIXME in src/ & modules/ durchgehen  
2. Wichtige Einträge hierher kopieren (mit Dateipfad + Zeile)  
3. Im Code [DONE] oder entfernen  
4. Dezentrale todo.md → löschen oder archivieren




Aktuelle Gesamtzahl: 325 Treffer (Stand heute)