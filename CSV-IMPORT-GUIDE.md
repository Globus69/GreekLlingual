# CSV IMPORT GUIDE

**Version:** 2.0
**Datum:** 18. Februar 2026
**Für:** HellenicHorizons GreekLingua Dashboard

---

## INHALTSVERZEICHNIS

1. [Schnellstart](#schnellstart)
2. [CSV-Format Anforderungen](#csv-format-anforderungen)
3. [Spalten-Referenz](#spalten-referenz)
4. [Template-Dateien](#template-dateien)
5. [Import-Modus](#import-modus)
6. [Schritt-für-Schritt Anleitung](#schritt-für-schritt-anleitung)
7. [Häufige Fehler & Lösungen](#häufige-fehler--lösungen)
8. [Validierungs-Regeln](#validierungs-regeln)
9. [Erweiterte Themen](#erweiterte-themen)

---

## SCHNELLSTART

### Minimaler Import in 3 Schritten:

1. **Template herunterladen:**
   - `/public/templates/Vorlage-Vokabeln-Schnell.csv` (nur Pflichtfelder)

2. **CSV bearbeiten:**
   - Griechischen Text + Englische Übersetzung eingeben
   - Level (A1, A2, B1, B2, C1, C2) auswählen
   - Difficulty (easy, medium, hard) auswählen
   - Frequency (1-5) angeben

3. **CSV importieren:**
   - Admin Panel öffnen → Vocabulary Management
   - "Import CSV" klicken
   - Datei auswählen
   - Import-Modus wählen (Append/Overwrite)
   - "Import" bestätigen

---

## CSV-FORMAT ANFORDERUNGEN

### Encoding & Syntax:

```
Character Encoding: UTF-8 with BOM (für Excel-Kompatibilität)
Delimiter: , (Komma)
Quote Character: " (doppelte Anführungszeichen)
Line Terminator: \r\n (Windows) oder \n (Unix)
Header Row: REQUIRED (Zeile 1)
```

### Header-Zeile (Zeile 1):

Die **erste Zeile** muss exakt die Spalten-Namen enthalten (siehe unten).

**WICHTIG:**
- Header müssen **ENGLISCH** sein (DB-Spalten-Namen)
- **KEINE** deutschen Beschreibungen wie "Griechisch (Transkription)"
- Groß-/Kleinschreibung wird ignoriert, aber konsistente Schreibweise empfohlen

---

## SPALTEN-REFERENZ

### Übersicht: Pflichtfelder vs. Optional

| Spalten-Name | Typ | Pflicht | Beschreibung | Beispiel |
|---|---|---|---|---|
| `greek_transcription` | text | ✅ **JA** | Griechischer Text | Γεια σου |
| `level` | text | ✅ **JA** | CEFR Level | A1, A2, B1, B2, C1, C2 |
| `difficulty` | text | ✅ **JA** | Schwierigkeit | easy, medium, hard |
| `frequency` | integer | ⚠️ **Default: 3** | Häufigkeit 1-5 | 5 |
| `nr` | integer | ❌ Optional | Nummerierung | 1, 2, 3... |
| `greek_phonetic` | text | ❌ Optional | Lautschrift/IPA | yá su |
| `en_translation` | text | ❌ Optional | Englische Übersetzung | Hello |
| `en_importance_reason` | text | ❌ Optional | Wichtigkeits-Begründung (EN) | Essential greeting... |
| `en_audio_url` | text | ❌ Optional | Audio-URL (EN) | https://... |
| `de_translation` | text | ❌ Optional | Deutsche Übersetzung | Hallo |
| `de_importance_reason` | text | ❌ Optional | Wichtigkeits-Begründung (DE) | Grundlegende... |
| `de_audio_url` | text | ❌ Optional | Audio-URL (DE) | https://... |
| `es_translation` | text | ❌ Optional | Spanische Übersetzung | Hola |
| `es_importance_reason` | text | ❌ Optional | Wichtigkeits-Begründung (ES) | Saludo básico... |
| `es_audio_url` | text | ❌ Optional | Audio-URL (ES) | https://... |
| `ru_translation` | text | ❌ Optional | Russische Übersetzung | Привет |
| `ru_importance_reason` | text | ❌ Optional | Wichtigkeits-Begründung (RU) | Основное... |
| `ru_audio_url` | text | ❌ Optional | Audio-URL (RU) | https://... |

### Detaillierte Spalten-Beschreibung:

#### **1. `greek_transcription`** (PFLICHT)

**Beschreibung:** Der griechische Text in griechischer Schrift.

**Format:**
- Text in griechischem Alphabet (Γεια, Ευχαριστώ, Νερό)
- Nicht leer
- UTF-8 kodiert

**Beispiele:**
```
✅ Γεια σου
✅ Καλημέρα
✅ Ευχαριστώ πολύ
❌ (leer)
❌ Yassou (lateinische Schrift)
```

---

#### **2. `level`** (PFLICHT)

**Beschreibung:** CEFR Sprachniveau (Common European Framework of Reference).

**Erlaubte Werte:**
```
A1, A2, B1, B2, C1, C2
```

**Regeln:**
- Nur eine der 6 erlaubten Werte
- Groß-/Kleinschreibung wird berücksichtigt (verwende Großbuchstaben)
- Keine anderen Werte erlaubt

**Beispiele:**
```
✅ A1
✅ B2
✅ C1
❌ a1 (Kleinbuchstaben)
❌ A3 (existiert nicht)
❌ Beginner
```

---

#### **3. `difficulty`** (PFLICHT)

**Beschreibung:** Schwierigkeitsgrad des Vokabels.

**Erlaubte Werte:**
```
easy, medium, hard
```

**WICHTIG:**
- **NICHT** "middle" verwenden!
- System erkennt nur "medium"

**Regeln:**
- Nur eine der 3 erlaubten Werte
- Kleinbuchstaben verwenden
- Keine Übersetzungen oder Synonyme

**Beispiele:**
```
✅ easy
✅ medium
✅ hard
❌ middle (wird ABGELEHNT!)
❌ Easy (Großbuchstabe)
❌ leicht
❌ schwer
```

---

#### **4. `frequency`** (OPTIONAL, Default: 3)

**Beschreibung:** Häufigkeit der Verwendung im täglichen Gebrauch.

**Erlaubte Werte:**
```
1, 2, 3, 4, 5
```

**Bedeutung:**
- **1:** Sehr selten
- **2:** Selten
- **3:** Mittel (Default)
- **4:** Häufig
- **5:** Sehr häufig

**Regeln:**
- Ganzzahl zwischen 1 und 5
- Wenn leer: Default-Wert 3 wird verwendet

**Beispiele:**
```
✅ 5 (sehr häufig, z.B. "Hallo")
✅ 3 (mittlere Häufigkeit)
✅ 1 (selten)
✅ (leer → Default 3)
❌ 0 (zu niedrig)
❌ 6 (zu hoch)
❌ 3.5 (keine Dezimalzahlen)
```

---

#### **5. `nr`** (OPTIONAL)

**Beschreibung:** Optionale Nummerierung für Sortierung.

**Format:**
- Ganzzahl (Integer)
- Keine bestimmte Reihenfolge erforderlich
- Kann für Sortierung in UI verwendet werden

**Beispiele:**
```
✅ 1
✅ 42
✅ 1000
✅ (leer)
❌ 1.5 (Dezimalzahl)
❌ #1 (kein Text)
```

---

#### **6. `greek_phonetic`** (OPTIONAL)

**Beschreibung:** Phonetische Transkription oder Lautschrift.

**Format:**
- Text (String)
- IPA (International Phonetic Alphabet) empfohlen
- Oder vereinfachte Lautschrift (z.B. "yá su")

**Beispiele:**
```
✅ yá su
✅ ef-cha-ri-STÓ
✅ [jaˈsu]
✅ (leer)
```

---

#### **7-18. Translation Fields** (OPTIONAL)

**Muster:**
```
{lang}_translation
{lang}_importance_reason
{lang}_audio_url
```

**Sprachen:**
- `en` = Englisch
- `de` = Deutsch
- `es` = Spanisch
- `ru` = Russisch

**Format:**
- `*_translation`: Text der Übersetzung
- `*_importance_reason`: Begründung warum wichtig (Kontext, Nutzung)
- `*_audio_url`: URL zu Audio-Datei (HTTPS oder leer)

**Beispiele:**

```csv
en_translation,en_importance_reason,en_audio_url
Hello,Essential greeting used daily,https://example.com/hello.mp3
Thank you,Expression of gratitude,
Water,Basic survival word,https://example.com/water.mp3
```

---

## TEMPLATE-DATEIEN

### Verfügbare Templates:

Alle Templates befinden sich in `/public/templates/`:

#### 1. **`Vorlage-Vokabeln-Schnell.csv`** (Empfohlen für Anfänger)

**Inhalt:**
- Nur Pflichtfelder
- Englische Übersetzung
- 10 Beispiel-Vokabeln (A1)

**Verwendung:**
```
Schneller Import für einfache Vokabeln
Ideal für: Erste Tests, schnelle Ergänzungen
```

**Spalten:**
```
greek_transcription, en_translation, level, difficulty, frequency
```

---

#### 2. **`Vorlage-Vokabeln-Vollständig.csv`** (Vollständig)

**Inhalt:**
- Alle Spalten (18 Felder)
- 2 Beispiel-Vokabeln mit allen 4 Sprachen
- Alle optionalen Felder enthalten

**Verwendung:**
```
Vollständiger Import mit mehrsprachigen Daten
Ideal für: Professionelle Content-Erstellung, vollständige Datenbank
```

**Spalten:**
```
nr, greek_transcription, greek_phonetic,
en_translation, en_importance_reason, en_audio_url,
de_translation, de_importance_reason, de_audio_url,
es_translation, es_importance_reason, es_audio_url,
ru_translation, ru_importance_reason, ru_audio_url,
level, difficulty, frequency
```

---

#### 3. **`Import-Vokabeln-A1-Vollständig.csv`** (50 A1 Vokabeln)

**Inhalt:**
- 50 grundlegende A1-Level Vokabeln
- Alle 4 Sprachen vollständig ausgefüllt
- Realistische Wichtigkeits-Begründungen

**Verwendung:**
```
Starter-Set für A1-Lerner
Ideal für: Demo, Initial-Daten, Beispiel-Content
```

---

#### 4. **`Import-Vokabeln-A1-Beispiel.csv`** (10 A1 Vokabeln - Schnellstart)

**Inhalt:**
- 10 häufigste A1-Level Vokabeln
- Alle 4 Sprachen
- Perfekt zum Testen

**Verwendung:**
```
Schnellstart-Set für neue Lerner
Ideal für: Erste Schritte, Demo, Tests
```

---

#### 5. **`Import-Vokabeln-A2-Vollständig.csv`** (50 A2 Vokabeln)

**Inhalt:**
- 50 fortgeschrittene A2-Level Vokabeln
- Komplexere Begriffe und Phrasen
- Alle 4 Sprachen

**Verwendung:**
```
Erweiterung für A2-Lerner
Ideal für: Fortgeschrittene Anfänger, A2-Kurse
```

---

#### 6. **`Import-Vokabeln-A2-Beispiel.csv`** (10 A2 Vokabeln - Reisen)

**Inhalt:**
- 10 wichtigste A2-Level Reise-Vokabeln
- Alle 4 Sprachen
- Thematisch fokussiert

**Verwendung:**
```
Themen-Set für Reisende
Ideal für: Urlaubsvorbereitung, A2-Tests
```

---

#### 7. **`Import-Vokabeln-B1-Vollständig.csv`** (25 B1 Vokabeln)

**Inhalt:**
- 25 B1-Level Vokabeln
- Abstrakte und komplexe Begriffe
- Alle 4 Sprachen

**Verwendung:**
```
Sample-Set für B1-Lerner
Ideal für: Fortgeschrittene Lerner, B1-Kurse
```

---

## IMPORT-MODUS

### Zwei Modi verfügbar:

#### **1. Append-Modus** (Standard)

**Beschreibung:**
- Fügt neue Vokabeln hinzu
- Überspringt Duplikate automatisch
- Bestehende Daten bleiben erhalten

**Duplikat-Erkennung:**
- Kombination: `greek_transcription + level`
- Beispiel: "Γεια σου" + "A1" existiert bereits → überspringen

**Verwendung:**
```
✅ Regelmäßige Updates
✅ Ergänzung bestehender Datenbank
✅ Import aus mehreren Quellen
```

**Beispiel-Ausgabe:**
```
✅ 45 imported
⚠️ 5 skipped (duplicates)
❌ 3 errors
```

---

#### **2. Overwrite-Modus** (Vorsicht!)

**Beschreibung:**
- **LÖSCHT ALLE** bestehenden Vokabeln
- Importiert dann neue Daten
- **NICHT RÜCKGÄNGIG ZU MACHEN!**

**Verwendung:**
```
⚠️ Komplette Datenbank-Erneuerung
⚠️ Initial-Setup
⚠️ Migration von anderem System
```

**Warnung:**
```
❗ Alle bestehenden Vokabeln werden GELÖSCHT!
❗ User-Progress geht VERLOREN!
❗ Backup vorher empfohlen!
```

---

## SCHRITT-FÜR-SCHRITT ANLEITUNG

### Schritt 1: Template vorbereiten

1. **Template auswählen:**
   ```
   Anfänger → Vorlage-Vokabeln-Schnell.csv
   Vollständig → Vorlage-Vokabeln-Vollständig.csv
   Level-spezifisch → Import-Vokabeln-A1-Vollständig.csv
   ```

2. **Template herunterladen:**
   - Navigiere zu `/public/templates/`
   - Lade gewünschtes Template herunter
   - Öffne in Excel, Google Sheets oder Text-Editor

3. **Header NICHT ändern:**
   ```
   ❌ Header-Zeile NIEMALS löschen oder umbenennen!
   ✅ Header-Zeile unverändert lassen
   ```

---

### Schritt 2: Daten eingeben

1. **Neue Zeile hinzufügen:**
   - Füge neue Zeile unter der letzten Zeile ein
   - **NICHT** zwischen Header und Daten einfügen

2. **Pflichtfelder ausfüllen:**
   ```
   greek_transcription: Γεια σου
   level: A1
   difficulty: easy
   frequency: 5
   ```

3. **Optionale Felder ausfüllen:**
   ```
   en_translation: Hello
   de_translation: Hallo
   ... (weitere nach Bedarf)
   ```

4. **Leere Felder:**
   - Optionale Felder können leer bleiben
   - Keine Platzhalter wie "N/A" oder "-" verwenden

---

### Schritt 3: CSV speichern

**Excel:**
```
Datei → Speichern unter → Typ: CSV UTF-8 (Komma-getrennt)
⚠️ NICHT "CSV (Trennzeichen-getrennt)" verwenden!
```

**Google Sheets:**
```
Datei → Herunterladen → Kommagetrennte Werte (.csv)
```

**Text-Editor:**
```
Encoding: UTF-8 with BOM
Speichern als: .csv
```

---

### Schritt 4: CSV importieren

1. **Admin Panel öffnen:**
   ```
   Login als Admin
   → Vocabulary Management
   → Import CSV
   ```

2. **Datei auswählen:**
   ```
   "Choose File" klicken
   → CSV-Datei auswählen
   → "Öffnen"
   ```

3. **Import-Modus wählen:**
   ```
   ○ Append (empfohlen) - Fügt neue Vokabeln hinzu
   ○ Overwrite (VORSICHT!) - Löscht alle bestehenden Daten
   ```

4. **Import starten:**
   ```
   "Import" Button klicken
   → Warte auf Bestätigung
   → Prüfe Ergebnis
   ```

---

### Schritt 5: Ergebnis prüfen

**Erfolgs-Meldung:**
```
✅ Import successful!
   45 entries imported
   3 entries skipped (duplicates)
   0 errors
```

**Fehler-Meldung:**
```
❌ Import failed
   Row 5: difficulty must be one of: easy, medium, hard
   Row 12: greek_transcription is required
```

**Nächste Schritte:**
- Bei Erfolg: Vokabeln im Vocabulary Management prüfen
- Bei Fehlern: CSV korrigieren und erneut importieren

---

## HÄUFIGE FEHLER & LÖSUNGEN

### Fehler 1: "greek_transcription is required"

**Ursache:**
- Leeres Feld in `greek_transcription` Spalte

**Lösung:**
```
✅ Fülle alle Zeilen mit griechischem Text
✅ Entferne leere Zeilen
✅ Prüfe ob Header korrekt ist
```

---

### Fehler 2: "difficulty must be one of: easy, medium, hard"

**Ursache:**
- Ungültiger Wert wie "middle", "Easy", "leicht"

**Lösung:**
```
❌ middle → ✅ medium
❌ Easy → ✅ easy
❌ schwer → ✅ hard
```

---

### Fehler 3: "level must be one of: A1, A2, B1, B2, C1, C2"

**Ursache:**
- Ungültiges Level wie "a1", "Beginner", "A3"

**Lösung:**
```
❌ a1 → ✅ A1
❌ Beginner → ✅ A1
❌ A0 → ✅ A1
```

---

### Fehler 4: "frequency must be between 1 and 5"

**Ursache:**
- Wert außerhalb 1-5 Bereich (z.B. 0, 6, 10)

**Lösung:**
```
❌ 0 → ✅ 1
❌ 6 → ✅ 5
❌ (leer) → ✅ 3 (Default) oder explizit 1-5
```

---

### Fehler 5: "CSV parsing failed"

**Ursache:**
- Falsche CSV-Struktur
- Fehlende Header-Zeile
- Inkonsistente Spalten-Anzahl

**Lösung:**
```
✅ Prüfe Header-Zeile (Zeile 1) vorhanden
✅ Alle Zeilen haben gleiche Spalten-Anzahl
✅ Keine zusätzlichen Leerzeilen zwischen Daten
✅ Verwende korrekte Delimiter (Komma)
```

---

### Fehler 6: "Column 'Griechisch (Transkription)' doesn't exist"

**Ursache:**
- Deutsche Header statt DB-Spalten-Namen

**Lösung:**
```
❌ Griechisch (Transkription) → ✅ greek_transcription
❌ Englische Übersetzung → ✅ en_translation
❌ Level A1 → ✅ level (Wert: A1)
```

**Verwende die neuen Templates (v2) mit korrekten Headern!**

---

### Fehler 7: "Duplicate entry"

**Ursache:**
- Vokabel existiert bereits für dieses Level
- Nur im Overwrite-Modus oder bei DB-Fehler

**Lösung:**
```
✅ Verwende Append-Modus (überspringt automatisch)
✅ Ändere Level (z.B. A1 → A2) wenn andere Bedeutung
✅ Prüfe bestehende Daten vor Import
```

---

### Fehler 8: "Excel zeigt griechische Zeichen falsch an"

**Ursache:**
- Falsches Encoding (nicht UTF-8)

**Lösung:**
```
Excel:
1. CSV öffnen mit "Daten → Aus Text/CSV"
2. Encoding: UTF-8 auswählen
3. Import bestätigen

Alternativ:
✅ Google Sheets verwenden (automatisch UTF-8)
✅ Text-Editor mit UTF-8 BOM speichern
```

---

### Fehler 9: "Empty file or no data rows"

**Ursache:**
- Nur Header-Zeile, keine Daten
- Alle Zeilen leer oder ungültig

**Lösung:**
```
✅ Mindestens 1 Daten-Zeile nach Header
✅ Prüfe ob Zeilen nicht versehentlich gelöscht wurden
✅ Validiere CSV-Struktur
```

---

## VALIDIERUNGS-REGELN

### Server-Side Validierung:

**Pre-Import Checks:**
1. CSV Struktur prüfen (Papa.parse)
2. Header-Zeile vorhanden
3. Mindestens 1 Daten-Zeile

**Per-Row Validierung:**
1. Pflichtfelder nicht leer
2. Enum-Werte korrekt (level, difficulty)
3. Zahlen im gültigen Bereich (frequency 1-5)
4. Datentypen korrekt (text vs. integer)

**Duplicate Check (Append-Modus):**
```sql
SELECT * FROM multilingual_vocabulary
WHERE greek_transcription = ?
AND level = ?
```

**Database Constraints:**
```sql
UNIQUE (greek_transcription, level)
CHECK (level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'))
CHECK (difficulty IN ('easy', 'medium', 'hard'))
CHECK (frequency >= 1 AND frequency <= 5)
```

---

### Client-Side Validierung (TODO):

**Geplante Features:**
- Live-Validierung vor Upload
- Inline-Fehler-Anzeige
- Auto-Fix für "middle" → "medium"
- Duplicate-Check vor Import

---

## ERWEITERTE THEMEN

### Audio-URLs

**Format:**
```
https://example.com/audio/hello.mp3
https://cdn.example.com/greek/A1/001.ogg
```

**Regeln:**
- Muss vollständige URL sein (inkl. https://)
- Leer lassen wenn kein Audio vorhanden
- Unterstützte Formate: MP3, OGG, WAV

**Beispiele:**
```
✅ https://example.com/hello.mp3
✅ (leer)
❌ /audio/hello.mp3 (relative URL)
❌ hello.mp3 (kein Protokoll)
```

---

### Importance Reason Best Practices

**Zweck:**
- Erklärt WARUM dieses Vokabel wichtig ist
- Gibt Kontext zur Verwendung
- Hilft Lernenden zu verstehen wann es verwendet wird

**Format:**
- Kurzer Satz (20-50 Wörter)
- Fokus auf Kontext und Häufigkeit
- Verschiedene Texte pro Sprache (nicht einfach übersetzen!)

**Beispiele:**

```
Englisch (EN):
"Essential greeting used daily in informal settings"

Deutsch (DE):
"Grundlegende Begrüßung täglich in informellen Situationen verwendet"

Spanisch (ES):
"Saludo básico usado diariamente en contextos informales"

Russisch (RU):
"Основное приветствие для неформальных ситуаций"
```

**Tipps:**
- Erwähne Häufigkeit (täglich, oft, selten)
- Nenne Kontext (formell, informell, geschäftlich)
- Gib Beispiel-Situationen (Restaurant, Geschäft, Reise)

---

### Bulk-Import Strategie

**Für große Datenmengen (100+ Vokabeln):**

1. **Split in mehrere Dateien:**
   ```
   Import-Vokabeln-A1-Teil1.csv (50 Einträge)
   Import-Vokabeln-A1-Teil2.csv (50 Einträge)
   Import-Vokabeln-A1-Teil3.csv (50 Einträge)
   ```

2. **Import in Sessions:**
   - Importiere 1 Datei pro Session
   - Warte auf Bestätigung
   - Prüfe Fehler vor nächster Datei

3. **Append-Modus verwenden:**
   - Kein Overwrite zwischen Sessions
   - Duplikate werden automatisch übersprungen

4. **Fehler-Log führen:**
   - Notiere fehlgeschlagene Zeilen
   - Korrigiere separat
   - Importiere Korrekturen einzeln

---

### Migration von alten Templates

**Wenn du alte Templates mit deutschen Headern hast:**

1. **Header-Mapping durchführen:**
   ```
   Alte Header → Neue Header
   Nr. → nr
   Griechisch (Transkription) → greek_transcription
   Lautschrift (Griechisch) → greek_phonetic
   Russische Übersetzung → ru_translation
   Wichtigkeit (Begründung) in Russisch → ru_importance_reason
   Audio in russisch → ru_audio_url
   Englische Übersetzung → en_translation
   Wichtigkeit (Begründung)in Englisch → en_importance_reason
   Audio in englisch → en_audio_url
   Spanische Übersetzung → es_translation
   Wichtigkeit (Begründung)in Spanisch → es_importance_reason
   Audio in Spanisch → es_audio_url
   Deutsche Übersetzung → de_translation
   Wichtigkeit (Begründung)in Deutsch → de_importance_reason
   Audio in deutsch → de_audio_url
   Level A1 → level
   difficulty (easy/middle/hard) → difficulty
   Häufigkeit im täglichen Gebrauch (1,2,3,4,5) → frequency
   ```

2. **"middle" → "medium" ersetzen:**
   ```
   Suche: middle
   Ersetze: medium
   ```

3. **Level-Spalte korrigieren:**
   ```
   Alte CSV: "Level A1" Spalte enthält "A1"
   Neue CSV: "level" Spalte enthält "A1"

   → Spalten-Namen ändern, Werte bleiben gleich
   ```

4. **Import testen:**
   - Importiere 1 Test-Zeile zuerst
   - Prüfe Ergebnis
   - Bei Erfolg: restliche Zeilen importieren

---

### Programmatischer Import (API)

**Für Entwickler:**

```bash
POST /api/admin/vocab/import

Headers:
  Content-Type: multipart/form-data
  X-CSRF-Token: <token>
  Cookie: session_token=<token>

Body:
  file: <csv-file>
  mode: append | overwrite

Response:
{
  "success": true,
  "imported": 45,
  "skipped": 3,
  "errors": []
}
```

**Authentifizierung:**
- Admin-Session erforderlich
- CSRF-Token validiert
- Session-Cookie in Request

---

## SUPPORT & HILFE

### Bei Problemen:

1. **Prüfe diese Checkliste:**
   - [ ] CSV im UTF-8 Format gespeichert
   - [ ] Header-Zeile korrekt (englische DB-Spalten)
   - [ ] Pflichtfelder ausgefüllt
   - [ ] difficulty = "medium" (nicht "middle")
   - [ ] level = Großbuchstaben (A1, nicht a1)
   - [ ] frequency = 1-5 (oder leer)
   - [ ] Keine leeren Zeilen zwischen Daten

2. **Validierungs-Script verwenden (TODO):**
   ```bash
   node validate-csv.js your-file.csv
   ```

3. **Test-Import durchführen:**
   - Erstelle CSV mit nur 1 Zeile
   - Importiere und prüfe Fehler
   - Korrigiere Probleme
   - Importiere vollständige Datei

4. **Fehler-Log prüfen:**
   - Import-Response enthält detaillierte Fehler
   - Zeilen-Nummer wird angegeben
   - Fehler-Meldung gibt Hinweis auf Problem

---

## CHANGELOG

### Version 2.0 (18. Februar 2026)
- ✅ Neue Templates mit korrekten DB-Spalten-Namen
- ✅ 5 Template-Varianten (quick, v2, A1, A2, B1)
- ✅ Vollständige Dokumentation
- ✅ Häufige Fehler & Lösungen hinzugefügt
- ✅ Migration-Guide für alte Templates

### Version 1.0 (vorher)
- ❌ Alte Templates mit deutschen Headern (deprecated)
- ❌ "middle" statt "medium" (deprecated)

---

**Ende des Guides**

Bei weiteren Fragen: Siehe `/CSV-TEMPLATES-ANALYSIS.md` für technische Details.
