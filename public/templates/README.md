# CSV Import Vorlagen

Dieses Verzeichnis enthält CSV-Vorlagen für den Vokabel-Import in das HellenicHorizons Greek Learning Dashboard.

## Übersicht

### Leere Vorlagen (Templates)

Diese Dateien enthalten nur Header oder wenige Beispielzeilen. Ideal zum Erstellen eigener Import-Dateien.

| Datei | Felder | Zeilen | Verwendung |
|-------|--------|--------|------------|
| `Vorlage-Vokabeln-Vollständig.csv` | 18 Felder | 2 | Vollständiges Schema mit allen Sprachen (EN, DE, ES, RU) |
| `Vorlage-Vokabeln-Schnell.csv` | 5 Felder | 10 | Minimal-Schema nur mit Pflichtfeldern (Greek, EN, Level, Difficulty, Frequency) |

### Import-fertige Vokabellisten

Diese Dateien enthalten vollständige Vokabellisten, die direkt importiert werden können.

#### A1 Niveau (Anfänger)

| Datei | Vokabeln | Sprachen | Beschreibung |
|-------|----------|----------|--------------|
| `Import-Vokabeln-A1-Vollständig.csv` | 50 | 4 | Komplette A1-Grundvokabeln (Begrüßungen, Zahlen, Basics) |
| `Import-Vokabeln-A1-Beispiel.csv` | 10 | 4 | Schnellstart-Set mit häufigsten A1-Wörtern |

#### A2 Niveau (Grundlegend)

| Datei | Vokabeln | Sprachen | Beschreibung |
|-------|----------|----------|--------------|
| `Import-Vokabeln-A2-Vollständig.csv` | 50 | 4 | A2-Vokabular (Shopping, Reisen, Alltag) |
| `Import-Vokabeln-A2-Beispiel.csv` | 10 | 4 | Häufigste A2-Ausdrücke für Reisen |

#### B1 Niveau (Fortgeschritten)

| Datei | Vokabeln | Sprachen | Beschreibung |
|-------|----------|----------|--------------|
| `Import-Vokabeln-B1-Vollständig.csv` | 25 | 4 | B1-Vokabular (Diskussionen, Meinungen, komplexe Themen) |

### Veraltete Dateien (DEPRECATED)

Diese Dateien werden nicht mehr verwendet und sollten nicht für neue Imports genutzt werden:

- `DEPRECATED-vocab-import-template-v2.csv` - Duplikat der Vollständig-Vorlage
- `DEPRECATED-vocabulary-template.csv` - Altes Schema (vor Multi-Sprach-Support)

---

## Verwendung

### 1. Vorlage herunterladen

**Neu anfangen:**
- `Vorlage-Vokabeln-Vollständig.csv` - für maximale Flexibilität (alle Sprachen)
- `Vorlage-Vokabeln-Schnell.csv` - für schnellen Import (nur Griechisch + Englisch)

**Mit Beispieldaten:**
- `Import-Vokabeln-A1-Beispiel.csv` - 10 häufigste A1-Wörter als Startpunkt

### 2. Datei bearbeiten

1. In Excel, LibreOffice Calc oder Google Sheets öffnen
2. Daten eingeben (Griechisch in griechischen Buchstaben!)
3. Als CSV speichern (UTF-8 Encoding!)

### 3. Im Admin-Panel importieren

1. Admin-Dashboard öffnen (`/admin/vocab`)
2. "Import CSV" Button klicken
3. Datei auswählen oder drag & drop
4. Import-Modus wählen:
   - **Append** - Neue Einträge hinzufügen (empfohlen)
   - **Overwrite** - ALLE bestehenden Daten löschen und ersetzen (⚠️ Vorsicht!)
5. Vorschau prüfen
6. Import starten

---

## CSV-Format Details

### Vollständiges Schema (18 Felder)

```csv
nr,greek_transcription,greek_phonetic,en_translation,en_importance_reason,en_audio_url,de_translation,de_importance_reason,de_audio_url,es_translation,es_importance_reason,es_audio_url,ru_translation,ru_importance_reason,ru_audio_url,level,difficulty,frequency
```

#### Pflichtfelder (müssen ausgefüllt sein):
- `greek_transcription` - Griechisches Wort (z.B. "Γεια σου")
- `level` - Sprachniveau (A1, A2, B1, B2, C1, C2)
- `difficulty` - Schwierigkeitsgrad (easy, medium, hard)
- `frequency` - Häufigkeit (1-5, wobei 5 = sehr häufig)

#### Optionale Felder:
- `nr` - Nummer (wird automatisch vergeben wenn leer)
- `greek_phonetic` - Lautschrift (z.B. "ya su")
- `*_translation` - Übersetzung in Zielsprache
- `*_importance_reason` - Begründung warum wichtig zu lernen
- `*_audio_url` - Link zu Audio-Datei

### Schnell-Schema (5 Felder)

```csv
greek_transcription,en_translation,level,difficulty,frequency
```

Nur die absoluten Mindest-Felder für schnellen Import.

---

## Sprach-Codes

Das System unterstützt 4 Zielsprachen:

| Code | Sprache | Beispiel-Feld |
|------|---------|---------------|
| `en` | Englisch | `en_translation` |
| `de` | Deutsch | `de_translation` |
| `es` | Spanisch | `es_translation` |
| `ru` | Russisch | `ru_translation` |

Jede Sprache hat 3 Felder:
1. `{code}_translation` - Übersetzung
2. `{code}_importance_reason` - Wichtigkeits-Begründung
3. `{code}_audio_url` - Audio-URL (optional)

---

## Häufige Fehler

### 1. Encoding-Probleme
❌ **Falsch:** CSV mit Windows-1252 oder ISO-8859-1 speichern
✅ **Richtig:** Immer UTF-8 verwenden (sonst werden griechische Buchstaben zu ??? oder �)

**Fix in Excel:**
- "Speichern unter" → "CSV UTF-8 (durch Trennzeichen getrennt) (*.csv)"

**Fix in LibreOffice:**
- "Speichern unter" → Format: "Text CSV (.csv)" → Character Set: "Unicode (UTF-8)"

### 2. Fehlende Pflichtfelder
❌ **Falsch:** `greek_transcription` leer oder nur `level` ausgefüllt
✅ **Richtig:** Mindestens `greek_transcription`, `level`, `difficulty`, `frequency` ausfüllen

### 3. Ungültige Werte
❌ **Falsch:**
- `level: "A3"` (existiert nicht)
- `difficulty: "schwer"` (muss englisch sein)
- `frequency: "10"` (nur 1-5 erlaubt)

✅ **Richtig:**
- `level: "A1"` oder "A2", "B1", "B2", "C1", "C2"
- `difficulty: "easy"` oder "medium", "hard"
- `frequency: "1"` bis "5"

### 4. Duplikate
Das System erlaubt KEINE Duplikate (gleicher `greek_transcription` + `level`).

❌ **Falsch:** Zweimal "Γεια σου" mit Level "A1" importieren
✅ **Richtig:** Jedes Wort nur einmal pro Level

**Bei Overwrite-Import:**
- Alle bestehenden Einträge werden GELÖSCHT
- Dann werden neue Einträge aus CSV importiert
- ⚠️ Kann NICHT rückgängig gemacht werden!

---

## Best Practices

### Für neue Lernende:
1. Starte mit `Import-Vokabeln-A1-Beispiel.csv` (10 Basics)
2. Wenn du mehr willst: `Import-Vokabeln-A1-Vollständig.csv` (50 Wörter)
3. Verwende **Append-Modus** um nach und nach aufzubauen

### Für eigene Listen:
1. Nutze `Vorlage-Vokabeln-Schnell.csv` wenn du nur EN-Übersetzungen hast
2. Nutze `Vorlage-Vokabeln-Vollständig.csv` wenn du mehrere Sprachen pflegst
3. Fülle `importance_reason` aus - hilft beim Lernen zu verstehen WARUM das Wort wichtig ist

### Für Lehrer/Content-Creators:
1. Erstelle thematische Listen (z.B. "Essen-A1.csv", "Reisen-A2.csv")
2. Nutze das `nr` Feld um Reihenfolge zu kontrollieren
3. Füge `audio_url` hinzu wenn du Audioaufnahmen hast (z.B. von Forvo.com)

---

## Änderungshistorie

| Datum | Version | Änderung |
|-------|---------|----------|
| 2026-02-18 | 2.0 | Umbenennung aller Dateien nach deutscher Naming Convention |
| 2026-02-16 | 1.5 | Hinzugefügt: B1-Vollständig (25 Vokabeln) |
| 2026-02-15 | 1.0 | Initiale Version mit A1/A2 Templates |

---

## Support

Bei Fragen oder Problemen:
1. Prüfe TROUBLESHOOTING-Practice-Modes.md
2. Checke CSV-IMPORT-GUIDE.md für detaillierte Import-Anleitung
3. Siehe CSV-QUICK-REFERENCE.md für Schnell-Referenz

**Letzte Aktualisierung:** 18. Februar 2026 von Agent 17
