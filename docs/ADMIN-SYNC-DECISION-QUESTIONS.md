# 🎯 Admin Page Synchronisation - Entscheidungsfragen

**Datum:** 18. Februar 2026, 03:00 CET
**Aufgabe:** `/admin/vocab` (Master) → `/admin/content` & `/admin/daily-phrases` synchronisieren
**Status:** Warten auf User-Entscheidungen

---

## 📊 ANALYSE-ERGEBNISSE

### CSV-Vorlage Struktur (CSV_Vorlage.csv):

**15 Spalten identifiziert:**
1. Nr.
2. Griechisch (Transkription)
3. Lautschrift (Griechisch)
4. Russische Übersetzung
5. Wichtigkeit (Begründung) in Russisch
6. Audio in Griechisch
7. Englische Übersetzung
8. Wichtigkeit (Begründung) in Englisch
9. Spanische Übersetzung
10. Wichtigkeit (Begründung) in Spanisch
11. Deutsche Übersetzung
12. Wichtigkeit (Begründung) in Deutsch
13. Level A
14. difficulty (easy/middle/hard)
15. Häufigkeit im täglichen Gebrauch

**Sprachen:** EN, DE, ES, RU (multilingual)

---

### Master Template: `/admin/vocab`

**Datenbank:** `multilingual_vocabulary` table
**Felder:**
- `greek_transcription` (Text)
- `greek_phonetic` (Lautschrift)
- `en_translation` (Englisch)
- `en_importance` (English importance)
- `de_translation` (Deutsch)
- `de_importance` (German importance)
- `es_translation` (Spanisch)
- `es_importance` (Spanish importance)
- `ru_translation` (Russisch)
- `ru_importance` (Russian importance)
- `audio_url` (Audio file)
- `level` (A1, A2, B1, B2, C1, C2)
- `difficulty` (easy, medium, hard)
- `frequency` (1-5)

**UI Features:**
- ✅ Sonner toast notifications (not inline messages)
- ✅ Rich statistics (level/difficulty breakdown)
- ✅ Table component with multi-select
- ✅ Bulk edit/delete
- ✅ CSV Import/Export
- ✅ Filtering (search, level, difficulty, frequency)
- ✅ Pagination (1-based)
- ✅ Create/Edit modal
- ✅ Browser confirm() for delete

---

### Target 1: `/admin/content`

**Datenbank:** `content` table (BILINGUAL only!)
**Felder:**
- `english` (Text)
- `greek` (Text)
- `type` (vocabulary, phrase, grammar)
- `level` (A1, A2, B1, B2, C1, C2)
- `difficulty` (easy, medium, hard)

**UI Features:**
- ✅ Inline state messages (no Sonner)
- ✅ Simple 3-card stats
- ✅ Inline list (no table component)
- ✅ Two-click delete (inline confirmation)
- ✅ CSV Import/Export
- ✅ Pagination (0-based)
- ✅ Create/Edit modal
- ⚠️ German text (nicht Englisch)

**Status:** Unterscheidet sich stark vom Master!

---

### Target 2: `/admin/daily-phrases`

**Datenbank:** `multilingual_phrases` table (MULTILINGUAL like vocab!)
**Felder:**
- Vermutlich identisch zu vocabulary (muss noch verifiziert werden)

**Status:** Muss noch analysiert werden

---

## ❓ KRITISCHE FRAGE: Datenbank-Inkompatibilität

### Problem erkannt:

**CSV_Vorlage.csv** ist MULTILINGUAL (4 Sprachen):
- Englisch + Wichtigkeit
- Deutsch + Wichtigkeit
- Spanisch + Wichtigkeit
- Russisch + Wichtigkeit

**ABER `/admin/content` table ist BILINGUAL** (nur 2 Sprachen):
- English
- Greek

### Optionen:

**A) CSV passt zu vocab/phrases (multilingual)**
- CSV_Vorlage.csv ist für `multilingual_vocabulary` & `multilingual_phrases`
- `/admin/content` bleibt bilingual (anderes Schema)
- Unterschiedliche Datenstrukturen beibehalten

**B) Alle Seiten multilingual machen**
- `/admin/content` table erweitern (4 Sprachen)
- Migration: content table → multilingual_content table
- Breaking Change! Alle Seiten identisch

**C) Alle Seiten bilingual machen**
- CSV reduzieren (nur EN + GR)
- vocab/phrases tables vereinfachen
- Breaking Change! Datenverlust für DE/ES/RU

---

## 🚦 ENTSCHEIDUNGSFRAGEN

Bevor wir weitermachen, muss ich wissen:

---

### ❓ FRAGE 1: Datenbank-Schema Strategy

**Was soll die Datenbasis sein?**

**A) MULTILINGUAL (EN, DE, ES, RU)**
- CSV_Vorlage.csv passt perfekt
- vocab & daily-phrases bleiben multilingual
- **ABER:** `/admin/content` muss umgebaut werden (neue table: multilingual_content)
- **Impact:** Migration, Breaking Change

**B) BILINGUAL (EN, GR)**
- content bleibt wie es ist
- **ABER:** vocab & daily-phrases müssen vereinfacht werden
- CSV_Vorlage.csv muss reduziert werden
- **Impact:** Datenverlust (DE, ES, RU)

**C) SEPARATE SCHEMAS**
- content = bilingual
- vocab = multilingual
- daily-phrases = multilingual
- **ABER:** Seiten können NICHT identisch sein (unterschiedliche Felder)
- **Impact:** Nur Layout/UI synchronisieren, nicht Datenstruktur

**Deine Entscheidung:** [ A / B / C / Andere Idee ]

---

**⏸️ PAUSE - Warte auf deine Antwort zu FRAGE 1**

Sobald du entschieden hast, kann ich die weiteren Fragen stellen.

---

**WICHTIG:**
- Option A = Aufwändig (Migration), aber CSV passt perfekt
- Option B = Datenverlust (DE, ES, RU löschen)
- Option C = Pragmatisch (nur Layout synchronisieren)

**Meine Empfehlung:** Option C (pragmatisch)
- Grund: Unterschiedliche Datenbases haben verschiedene Zwecke
- content = learning materials (bilingual)
- vocab = vocabulary training (multilingual für internationale User)

Was denkst du? 🤔
