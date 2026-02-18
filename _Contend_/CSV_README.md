# 📄 CSV Import/Export Vorlagen - Anleitung

**Datum:** 18. Februar 2026
**Für:** multilingual_content table
**Passend zu:** VocabModal.tsx Dialog

---

## 📂 VERFÜGBARE DATEIEN

### 1. `multilingual_content_import_template.csv`
- **Zweck:** Leere Vorlage zum Ausfüllen
- **Nutzung:** Neue Inhalte hinzufügen
- **Enthält:** 3 Zeilen (2 Beispiele + 1 leer)

### 2. `multilingual_content_export_example.csv`
- **Zweck:** Vollständiges Beispiel mit Daten
- **Nutzung:** Verständnis der Struktur
- **Enthält:** 15 Einträge (vocabulary, phrase, grammar)

### 3. `CSV_Vorlage.csv` (Original)
- **Zweck:** Ursprüngliche Vorlage
- **Enthält:** 10 Einträge (nur vocabulary)

---

## 📋 CSV-STRUKTUR (19 Spalten)

### Spalten-Übersicht:

| # | Spalte | Pflicht | Beispiel | Beschreibung |
|---|--------|---------|----------|--------------|
| 1 | Nr | Nein | 1 | Sortier-Nummer |
| 2 | Type | Ja | vocabulary | vocabulary/phrase/grammar |
| 3 | Griechisch (Transkription) | Ja | καλησπέρα | Griechischer Text |
| 4 | Lautschrift (Griechisch) | Nein | kalispera | Aussprache-Hilfe |
| 5 | Englische Übersetzung | Nein | good evening | English |
| 6 | Wichtigkeit (Begründung) in Englisch | Nein | evening greeting | Why important? |
| 7 | Audio URL (Englisch) | Nein | https://... | Audio file URL |
| 8 | Deutsche Übersetzung | Nein | guten Abend | Deutsch |
| 9 | Wichtigkeit (Begründung) in Deutsch | Nein | abendliche Begrüßung | Warum wichtig? |
| 10 | Audio URL (Deutsch) | Nein | https://... | Audio file URL |
| 11 | Spanische Übersetzung | Nein | buenas noches | Español |
| 12 | Wichtigkeit (Begründung) in Spanisch | Nein | saludo nocturno | ¿Por qué importante? |
| 13 | Audio URL (Spanisch) | Nein | https://... | Audio file URL |
| 14 | Russische Übersetzung | Nein | добрый вечер | Русский |
| 15 | Wichtigkeit (Begründung) in Russisch | Nein | вечернее приветствие | Почему важно? |
| 16 | Audio URL (Russisch) | Nein | https://... | Audio file URL |
| 17 | Level | Ja | A2 | A1, A2, B1, B2, C1, C2 |
| 18 | Difficulty | Ja | easy | easy, medium, hard |
| 19 | Häufigkeit (1-5) | Ja | 5 | 1 = selten, 5 = sehr häufig |

---

## ✅ PFLICHTFELDER

**Mindestens erforderlich:**
1. Type (vocabulary, phrase, grammar)
2. Griechisch (Transkription)
3. Level (A1-C2)
4. Difficulty (easy, medium, hard)
5. Häufigkeit (1-5)

**Optional aber empfohlen:**
- Mindestens eine Übersetzung (EN, DE, ES oder RU)
- Lautschrift (Griechisch) für Anfänger
- Wichtigkeits-Begründung (hilft beim Lernen)

---

## 📝 AUSFÜLL-ANLEITUNG

### Schritt 1: Template öffnen
```
_Contend_/multilingual_content_import_template.csv
```

### Schritt 2: Daten eintragen

**Beispiel:**
```csv
Nr;Type;Griechisch...
1;vocabulary;Γεια σου;ya su;Hello;common greeting;;Hallo;häufige Begrüßung;;Hola;saludo común;;Привет;общее приветствие;;A1;easy;5
```

### Schritt 3: Speichern
- **Format:** CSV (UTF-8)
- **Trennzeichen:** Semikolon (;)
- **Encoding:** UTF-8 (wichtig für griechische/russische Zeichen!)

### Schritt 4: Importieren
- **Via:** `/admin/content` → Import CSV Button
- **Oder:** SQL Import Script

---

## 🔤 WICHTIGE HINWEISE

### Encoding (UTF-8):
- ✅ **Immer UTF-8 verwenden!**
- ❌ Nicht ASCII/ANSI (griechische/russische Zeichen gehen verloren)
- Excel: "Speichern unter" → CSV UTF-8

### Trennzeichen (Semikolon):
- ✅ Semikolon (;) verwenden
- ❌ Nicht Komma (,) - wegen Dezimalzahlen

### Zeilenumbrüche:
- ✅ Keine Zeilenumbrüche innerhalb von Feldern
- ❌ Wenn doch: Feld in Anführungszeichen "..."

### Anführungszeichen:
- Nur wenn Feld Semikolon oder Zeilenumbruch enthält
- Beispiel: `"Hallo; guten Tag"`

---

## 📊 BEISPIEL-EINTRÄGE

### Vocabulary Entry:
```csv
1;vocabulary;καλησπέρα;kalispera;good evening;evening greeting;;guten Abend;abendliche Begrüßung;;buenas noches;saludo nocturno;;добрый вечер;вечернее приветствие;;A2;easy;5
```

### Phrase Entry:
```csv
11;phrase;Τι κάνεις;Ti káneis;How are you?;basic greeting;;Wie geht es dir?;grundlegende Begrüßung;;¿Cómo estás?;saludo básico;;Как дела?;базовое приветствие;;A1;easy;5
```

### Grammar Entry:
```csv
13;grammar;ο/η/το;o/i/to;the (definite article);essential grammar;;der/die/das;wesentliche Grammatik;;el/la/lo;gramática esencial;;the (определенный артикль);важная грамматика;;A1;medium;5
```

---

## 🔧 IMPORT-OPTIONEN

### Option 1: Append (Anhängen)
- Neue Einträge werden hinzugefügt
- Bestehende Einträge bleiben erhalten
- **Empfohlen für:** Erste Imports

### Option 2: Overwrite (Überschreiben)
- Bestehende Einträge mit gleicher ID werden aktualisiert
- Neue Einträge werden hinzugefügt
- **Empfohlen für:** Updates

### Option 3: Replace All (Alles ersetzen)
- ⚠️ **VORSICHT:** Alle bestehenden Daten werden gelöscht!
- Nur CSV-Daten bleiben übrig
- **Nur verwenden wenn:** Kompletter Neustart gewollt

---

## 🚨 HÄUFIGE FEHLER

### 1. Encoding-Fehler
**Problem:** Griechische Zeichen werden zu `???`
**Lösung:** CSV als UTF-8 speichern

### 2. Trennzeichen-Fehler
**Problem:** Spalten nicht korrekt getrennt
**Lösung:** Semikolon (;) verwenden, nicht Komma

### 3. Level-Fehler
**Problem:** "Level A" statt "A2"
**Lösung:** Nur den Wert eintragen: A1, A2, B1, B2, C1, C2

### 4. Difficulty-Fehler
**Problem:** "middle" statt "medium"
**Lösung:** Nur: easy, medium, hard

### 5. Frequency-Fehler
**Problem:** "high" oder "sehr häufig"
**Lösung:** Nur Zahlen: 1, 2, 3, 4, 5

---

## 📤 EXPORT-ANLEITUNG

### Via Admin Panel:
1. **Öffne:** `/admin/content`
2. **Klick:** Export CSV Button
3. **Optional:** Filter anwenden (Level, Difficulty, etc.)
4. **Download:** `content-export-2026-02-18.csv`

### Via SQL:
```sql
COPY (
    SELECT
        nr,
        type,
        greek_transcription,
        greek_phonetic,
        en_translation,
        en_importance_reason,
        en_audio_url,
        de_translation,
        de_importance_reason,
        de_audio_url,
        es_translation,
        es_importance_reason,
        es_audio_url,
        ru_translation,
        ru_importance_reason,
        ru_audio_url,
        level,
        difficulty,
        frequency
    FROM multilingual_content
    ORDER BY nr, created_at
) TO '/tmp/export.csv'
WITH (FORMAT CSV, HEADER, DELIMITER ';', ENCODING 'UTF8');
```

---

## 🎯 BEST PRACTICES

### 1. Immer mit kleinem Test starten
- Erst 1-5 Einträge importieren
- Prüfen ob alles korrekt ist
- Dann Rest importieren

### 2. Backup vor großen Imports
```sql
-- Backup erstellen
CREATE TABLE multilingual_content_backup AS
SELECT * FROM multilingual_content;
```

### 3. Validierung nach Import
- Anzahl Zeilen prüfen
- Stichproben anschauen
- Encoding prüfen (griechische Zeichen korrekt?)

### 4. Schrittweise auffüllen
1. Import mit nur Griechisch + Englisch
2. Später: Deutsche Übersetzungen ergänzen
3. Später: Spanische Übersetzungen ergänzen
4. Später: Russische Übersetzungen ergänzen

---

## 📚 ZUSÄTZLICHE RESSOURCEN

### Vorlagen-Dateien:
- `multilingual_content_import_template.csv` - Zum Ausfüllen
- `multilingual_content_export_example.csv` - Beispiel mit 15 Einträgen
- `CSV_Vorlage.csv` - Original (10 Einträge)

### Dokumentation:
- `DIALOG-ANALYSIS-COMPLETE.md` - Dialog-Struktur erklärt
- `MIGRATION-082-README.md` - Datenbank-Migration
- `ADMIN-PAGES-SYNC-PLAN.md` - Synchronisations-Plan

### Tools:
- Excel/LibreOffice: CSV bearbeiten
- Google Sheets: Online bearbeiten (Export als CSV UTF-8)
- VS Code: Mit CSV-Extension bearbeiten

---

## ❓ HÄUFIG GESTELLTE FRAGEN (FAQ)

### Q: Muss ich alle Sprachen ausfüllen?
**A:** Nein! Mindestens eine Übersetzung ist empfohlen. Leere Spalten sind OK.

### Q: Kann ich Audio-URLs später hinzufügen?
**A:** Ja! Import ohne Audio, später via Update ergänzen.

### Q: Was ist "Wichtigkeit (Begründung)"?
**A:** Erklärt warum dieses Wort wichtig ist (z.B. "common greeting", "daily use")

### Q: Kann ich Type ändern?
**A:** Ja! vocabulary, phrase oder grammar. Bestimmt wie Wort kategorisiert wird.

### Q: Was macht die Nr-Spalte?
**A:** Sortierung. Nützlich wenn du eine bestimmte Reihenfolge willst. Optional!

---

## ✅ CHECKLISTE VOR IMPORT

- [ ] UTF-8 Encoding geprüft
- [ ] Trennzeichen ist Semikolon (;)
- [ ] Pflichtfelder ausgefüllt (Type, Greek, Level, Difficulty, Frequency)
- [ ] Level-Werte korrekt (A1, A2, B1, B2, C1, C2)
- [ ] Difficulty-Werte korrekt (easy, medium, hard)
- [ ] Frequency-Werte korrekt (1, 2, 3, 4, 5)
- [ ] Griechische Zeichen korrekt angezeigt
- [ ] Test-Import mit 1-5 Zeilen durchgeführt
- [ ] Backup erstellt (bei großen Imports)

---

**Viel Erfolg beim Importieren! 🚀**

Bei Fragen: Dokumentation lesen oder Admin kontaktieren.
