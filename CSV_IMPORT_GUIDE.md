# CSV Import Guide - Vokabeln Import

**Status:** ✅ Fixed (2026-02-18)

## Problem behoben

Der Vokabel-CSV-Import unterstützt jetzt:
- ✅ Semikolon (;) als Trennzeichen
- ✅ Deutsche Spaltennamen
- ✅ "middle" wird automatisch zu "medium" konvertiert
- ✅ Alle 4 Sprachen (EN, DE, ES, RU) mit Wichtigkeits-Begründungen und Audio-URLs

## Unterstützte CSV-Formate

### Format 1: Deutsches Format (Semikolon-getrennt)

**Beispiel:** `_Contend_/Vokabeln_import.csv`

```csv
Nr.;Griechisch (Transkription);Lautschrift (Griechisch);Russische Übersetzung;Wichtigkeit (Begründung) in Russisch;Audio in russisch;Englische Übersetzung;Wichtigkeit (Begründung)in Englisch;Audio in englisch;Spanische Übersetzung;Wichtigkeit (Begründung)in Spanisch;Audio in Spanisch;Deutsche Übersetzung;Wichtigkeit (Begründung)in Deutsch;Audio in deutsch;Level;difficulty (easy/middle/hard);Häufigkeit im täglichen Gebrauch
1;γεια σου;gia sou;привет;самое важное приветствие;;hello;basic greeting;;hola;saludo básico;;hallo;wichtigste Begrüßung;;A1;easy;1
```

**Spaltennamen (Deutsch):**
- `Nr.` - Optionale Nummer
- `Griechisch (Transkription)` - **Pflicht**
- `Lautschrift (Griechisch)` - Optional
- `Russische Übersetzung` - Optional
- `Wichtigkeit (Begründung) in Russisch` - Optional
- `Audio in russisch` - Optional (URL)
- `Englische Übersetzung` - Optional
- `Wichtigkeit (Begründung)in Englisch` - Optional
- `Audio in englisch` - Optional (URL)
- `Spanische Übersetzung` - Optional
- `Wichtigkeit (Begründung)in Spanisch` - Optional
- `Audio in Spanisch` - Optional (URL)
- `Deutsche Übersetzung` - Optional
- `Wichtigkeit (Begründung)in Deutsch` - Optional
- `Audio in deutsch` - Optional (URL)
- `Level` - **Pflicht** (A1, A2, B1, B2, C1, C2)
- `difficulty (easy/middle/hard)` - **Pflicht** (easy, middle, hard)
- `Häufigkeit im täglichen Gebrauch` - **Pflicht** (1-5)

### Format 2: Englisches Format (Komma-getrennt)

**Beispiel:** Bestehende Templates

```csv
nr,greek_transcription,greek_phonetic,en_translation,en_importance_reason,en_audio_url,de_translation,de_importance_reason,de_audio_url,es_translation,es_importance_reason,es_audio_url,ru_translation,ru_importance_reason,ru_audio_url,level,difficulty,frequency
1,γεια σου,gia sou,hello,basic greeting,,hallo,wichtigste Begrüßung,,hola,saludo básico,,привет,самое важное приветствие,,A1,easy,1
```

## Import durchführen

1. **In Admin-Oberfläche gehen:**
   - Navigiere zu `/admin/vocab`
   - Klicke auf "Import" Button

2. **CSV-Datei auswählen:**
   - Drag & Drop oder File Picker
   - Format wird automatisch erkannt (Semikolon oder Komma)

3. **Vorschau prüfen:**
   - Erste 10 Zeilen werden angezeigt
   - Validierungsfehler werden rot markiert

4. **Import-Modus wählen:**
   - **Append** (Empfohlen): Fügt neue Einträge hinzu
   - **Overwrite** (Vorsicht!): Löscht ALLE bestehenden Einträge

5. **Import starten:**
   - Klicke "Import"
   - Warte auf Erfolgsmeldung

## Wichtige Hinweise

### Pflichtfelder
- `greek_transcription` / `Griechisch (Transkription)`
- `level` / `Level`
- `difficulty` / `difficulty (easy/middle/hard)`
- `frequency` / `Häufigkeit im täglichen Gebrauch (1;2;3;4;5)`

### Difficulty-Werte
- ✅ `easy` - Einfach
- ✅ `medium` oder `middle` - Mittel (beide werden akzeptiert!)
- ✅ `hard` - Schwer

### Level-Werte
- A1, A2, B1, B2, C1, C2 (Groß- oder Kleinschreibung)

### Frequency-Werte
- 1 = Sehr häufig
- 2 = Häufig
- 3 = Mittel
- 4 = Selten
- 5 = Sehr selten

## Fehlerbehebung

### Problem: "greek_transcription is required"
**Lösung:** Spalte `Griechisch (Transkription)` oder `greek_transcription` fehlt oder ist leer

### Problem: "difficulty must be easy, medium, or hard"
**Lösung:** Wert in Spalte `difficulty` ist ungültig. Verwende: easy, middle (wird zu medium), oder hard

### Problem: "frequency must be 1-5"
**Lösung:** Wert in Spalte `Häufigkeit im täglichen Gebrauch` muss zwischen 1 und 5 sein

### Problem: Spalten werden nicht erkannt
**Lösung:**
1. Prüfe, ob die CSV Semikolon (;) als Trennzeichen verwendet
2. Prüfe, ob die Spaltennamen exakt mit der Vorlage übereinstimmen
3. Keine zusätzlichen Leerzeichen in den Spaltennamen

## Beispiel-CSV testen

Die Datei `_Contend_/Vokabeln_import.csv` sollte jetzt ohne Fehler importiert werden können.

**Test:**
1. Gehe zu `/admin/vocab`
2. Klicke "Import"
3. Wähle `Vokabeln_import.csv`
4. Vorschau sollte alle Zeilen korrekt anzeigen
5. Klicke "Import" → Erfolg!

## Template herunterladen

Im Import-Dialog stehen 3 Templates zur Verfügung:
- **📥 Vorlage Vollständig** - Alle Felder (EN, DE, ES, RU)
- **⚡ Vorlage Schnell** - Nur Pflichtfelder
- **📚 A1 Beispiel** - 10 fertige A1-Vokabeln

## Technische Details

Der Import verwendet `papaparse` mit folgender Konfiguration:
- `delimiter: ';'` - Erkennt Semikolon-Trennung
- `transformHeader` - Mappt deutsche → englische Spaltennamen
- Automatische Normalisierung von "middle" → "medium"

### Spalten-Mapping (Intern)

| Deutsch | Englisch (Intern) |
|---------|-------------------|
| `Nr.` | `nr` |
| `Griechisch (Transkription)` | `greek_transcription` |
| `Lautschrift (Griechisch)` | `greek_phonetic` |
| `Russische Übersetzung` | `ru_translation` |
| `Wichtigkeit (Begründung) in Russisch` | `ru_importance_reason` |
| `Audio in russisch` | `ru_audio_url` |
| `Englische Übersetzung` | `en_translation` |
| `Wichtigkeit (Begründung)in Englisch` | `en_importance_reason` |
| `Audio in englisch` | `en_audio_url` |
| `Spanische Übersetzung` | `es_translation` |
| `Wichtigkeit (Begründung)in Spanisch` | `es_importance_reason` |
| `Audio in Spanisch` | `es_audio_url` |
| `Deutsche Übersetzung` | `de_translation` |
| `Wichtigkeit (Begründung)in Deutsch` | `de_importance_reason` |
| `Audio in deutsch` | `de_audio_url` |
| `Level` | `level` |
| `difficulty (easy/middle/hard)` | `difficulty` |
| `Häufigkeit im täglichen Gebrauch` | `frequency` |
