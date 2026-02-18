# CSV IMPORT QUICK REFERENCE

**Schnellreferenz für CSV-Import**

---

## TEMPLATES

### Welches Template soll ich verwenden?

| Anwendungsfall | Template | Dateipfad |
|---|---|---|
| **Schneller Test/Demo** | Vorlage Schnell | `/public/templates/Vorlage-Vokabeln-Schnell.csv` |
| **Vollständiger Import** | Vorlage Vollständig | `/public/templates/Vorlage-Vokabeln-Vollständig.csv` |
| **A1 Starter-Set (50)** | A1 Vollständig | `/public/templates/Import-Vokabeln-A1-Vollständig.csv` |
| **A1 Schnellstart (10)** | A1 Beispiel | `/public/templates/Import-Vokabeln-A1-Beispiel.csv` |
| **A2 Erweiterung (50)** | A2 Vollständig | `/public/templates/Import-Vokabeln-A2-Vollständig.csv` |
| **A2 Beispiel (10)** | A2 Beispiel | `/public/templates/Import-Vokabeln-A2-Beispiel.csv` |
| **B1 Sample (25)** | B1 Vollständig | `/public/templates/Import-Vokabeln-B1-Vollständig.csv` |

---

## PFLICHTFELDER

Diese Felder MÜSSEN ausgefüllt sein:

```csv
greek_transcription,level,difficulty,frequency
Γεια σου,A1,easy,5
```

### Erlaubte Werte:

| Feld | Erlaubte Werte |
|---|---|
| `level` | A1, A2, B1, B2, C1, C2 |
| `difficulty` | easy, medium, hard |
| `frequency` | 1, 2, 3, 4, 5 |

**WICHTIG:** `medium` (NICHT `middle`!)

---

## VALIDATION

Vor dem Import validieren:

```bash
node scripts/validate-csv.js your-file.csv
```

**Output:**
- ✅ Grün = OK
- ❌ Rot = Fehler (muss korrigiert werden)
- ⚠️ Gelb = Warnung (optional)

---

## HÄUFIGE FEHLER

### 1. "difficulty must be one of: easy, medium, hard"

❌ FALSCH:
```csv
difficulty
middle
Easy
schwer
```

✅ RICHTIG:
```csv
difficulty
medium
easy
hard
```

---

### 2. "Column 'Griechisch (Transkription)' doesn't exist"

❌ FALSCH: Deutsche Header
```csv
Griechisch (Transkription),Englische Übersetzung,Level A1
```

✅ RICHTIG: DB-Spalten-Namen
```csv
greek_transcription,en_translation,level
```

---

### 3. "level must be one of: A1, A2, B1, B2, C1, C2"

❌ FALSCH:
```csv
level
a1
Beginner
A0
```

✅ RICHTIG:
```csv
level
A1
B2
C1
```

---

## IMPORT-MODUS

### Append (Standard):
- Fügt neue Vokabeln hinzu
- Überspringt Duplikate
- **Empfohlen für reguläre Updates**

### Overwrite (Vorsicht!):
- LÖSCHT ALLE bestehenden Vokabeln
- Importiert dann neue Daten
- **NUR für komplette Neu-Initialisierung**

---

## SCHRITT-FÜR-SCHRITT

### 1. Template herunterladen
```
/public/templates/Vorlage-Vokabeln-Schnell.csv
```

### 2. Bearbeiten
- Excel, Google Sheets oder Text-Editor
- Header NICHT ändern
- Neue Zeilen hinzufügen

### 3. Speichern
```
Excel: "Speichern unter" → CSV UTF-8
Google Sheets: "Herunterladen" → CSV
```

### 4. Validieren
```bash
node scripts/validate-csv.js your-file.csv
```

### 5. Importieren
```
Admin Panel → Vocabulary Management → Import CSV
```

---

## DOKUMENTATION

### Vollständige Guides:
- `/CSV-IMPORT-GUIDE.md` - Detaillierte Anleitung
- `/CSV-TEMPLATES-ANALYSIS.md` - Technische Details
- `/AGENT-13-CSV-TEMPLATE-DELIVERY.md` - Delivery Report

---

## SUPPORT

### Bei Problemen:

1. **Validiere die CSV-Datei:**
   ```bash
   node scripts/validate-csv.js your-file.csv
   ```

2. **Prüfe Checkliste:**
   - [ ] UTF-8 Encoding
   - [ ] Header korrekt (englisch, DB-Spalten)
   - [ ] Pflichtfelder ausgefüllt
   - [ ] `difficulty = medium` (nicht `middle`)
   - [ ] `level = A1` (Großbuchstaben)
   - [ ] `frequency = 1-5`

3. **Teste mit 1 Zeile:**
   - Erstelle CSV mit nur 1 Vokabel
   - Importiere
   - Prüfe Fehler
   - Korrigiere vollständige Datei

---

## BEISPIEL

**Minimal CSV (Quick Import):**

```csv
greek_transcription,en_translation,level,difficulty,frequency
Γεια σου,Hello,A1,easy,5
Ευχαριστώ,Thank you,A1,easy,5
Νερό,Water,A1,easy,5
```

**Vollständige CSV (Template V2):**

```csv
nr,greek_transcription,greek_phonetic,en_translation,en_importance_reason,en_audio_url,de_translation,de_importance_reason,de_audio_url,es_translation,es_importance_reason,es_audio_url,ru_translation,ru_importance_reason,ru_audio_url,level,difficulty,frequency
1,Γεια σου,yá su,Hello,Essential greeting used daily,,Hallo,Grundlegende Begrüßung,,Hola,Saludo básico,,Привет,Основное приветствие,,A1,easy,5
```

---

**Für Details siehe:** `/CSV-IMPORT-GUIDE.md`
