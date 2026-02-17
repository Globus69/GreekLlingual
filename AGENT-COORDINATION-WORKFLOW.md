# AGENT COORDINATION WORKFLOW

**Erstellt:** 17. Februar 2026
**Zweck:** Workflow-Guide für Agent-Koordination
**Zielgruppe:** Master + Agents

---

## 🎯 ÜBERBLICK

Dieser Workflow stellt sicher, dass alle Agents koordiniert arbeiten, Blocker früh erkannt werden und keine Doppelarbeit entsteht.

**Kern-Prinzipien:**
1. **Daily Standups:** Täglicher Status-Austausch
2. **Transparenz:** Jeder weiß, woran andere arbeiten
3. **Frühe Blocker-Erkennung:** Probleme werden sofort kommuniziert
4. **Dependencies Tracking:** Wer wartet auf wen?

---

## 📋 DAILY STANDUP WORKFLOW

### **FÜR AGENTS:**

#### **Ende des Arbeitstages (5 Min):**
1. **Kopiere Template:**
   ```bash
   cp DAILY-STANDUP-TEMPLATE.md DAILY-STANDUP-$(date +%Y-%m-%d).md
   ```

2. **Fülle deinen Abschnitt aus:**
   - ✅ Was heute abgeschlossen
   - 🔄 Was morgen geplant
   - 🚧 Blocker (falls vorhanden)
   - ⏱️ Fortschritt (% complete)

3. **Commit:**
   ```bash
   git add DAILY-STANDUP-*.md
   git commit -m "standup(agent-X): Daily update [DATUM]"
   git push
   ```

#### **Format (Beispiel):**
```markdown
### 🤖 Agent 1 (End-to-End Testing)

- ✅ **Gestern abgeschlossen:**
  - Matching Game Test durchgeführt
  - DB-Verifizierung erfolgreich

- 🔄 **Heute geplant:**
  - Multiple Choice Quiz testen
  - Write Input testen

- 🚧 **Blocker:**
  - Keine

- ⏱️ **Fortschritt:**
  - Status: 60% complete
  - ETA: Morgen Mittag
```

---

### **FÜR MASTER:**

#### **Morgens (10 Min):**
1. **Daily Standup reviewed:**
   ```bash
   cat DAILY-STANDUP-$(date +%Y-%m-%d).md
   ```

2. **Blocker prüfen:**
   - Gibt es 🚧 Blocker?
   - Sofort adressieren!

3. **Prioritäten setzen:**
   - Welcher Agent braucht Unterstützung?
   - Dependencies prüfen

4. **Gesamt-Fortschritt aktualisieren:**
   - Tabelle "GESAMT-FORTSCHRITT" updated

#### **Bei Bedarf (Sofort):**
5. **Blocker-Resolution:**
   - Agent kontaktieren
   - Lösung finden
   - Im Standup dokumentieren

---

## 🚨 BLOCKER-HANDLING

### **Was ist ein Blocker?**
- Task kann nicht fortgesetzt werden
- Wartet auf externe Ressource
- Technisches Problem unlösbar
- Entscheidung von Master benötigt

### **Blocker melden (Agent):**
```markdown
- 🚧 **Blocker:**
  - [CRITICAL] Dialog öffnet nicht - API-Call hängt
  - Benötigt: Debug-Hilfe von Master
  - Impact: Kann nicht weiter testen
```

### **Blocker lösen (Master):**
1. **Sofort reagieren** (<4h Response-Time)
2. **Im Standup dokumentieren:**
   ```markdown
   ## 🚨 KRITISCHE PUNKTE

   ### Blocker die SOFORT gelöst werden müssen:
   - [x] Agent 1: Dialog-Issue → GELÖST (Debug-Logs hinzugefügt)
   ```

3. **Agent benachrichtigen** (Commit Message oder Direct)

---

## 🔗 DEPENDENCIES TRACKING

### **Dependencies dokumentieren:**
```markdown
### Dependencies zwischen Agents:
- Agent 3 wartet auf Agent 1 für [Test-Ergebnisse]
- Agent 1 wartet auf Master für [API-Fix]
```

### **Wie vermeiden:**
- **Unabhängige Branches:** Jeder Agent eigener Branch
- **Klare Scope:** Tasks dürfen sich nicht überlappen
- **Early Communication:** Bei Überschneidung sofort melden

---

## 📊 FORTSCHRITTS-TRACKING

### **Prozent-Berechnung:**
```
Fortschritt = (Erledigte Tasks / Gesamt Tasks) * 100

Beispiel:
- Gesamt Tasks: 10
- Erledigt: 6
- Fortschritt: 60%
```

### **Status-Definitionen:**
- ⏳ **0-25%:** Gestartet, noch früh
- 🔄 **25-75%:** In Arbeit, guter Fortschritt
- ✅ **75-100%:** Fast fertig / Abgeschlossen

---

## 🎯 ZIELE BIS NÄCHSTES STANDUP

### **Wie setzen (Agent):**
- **Realistisch:** Erreichbar bis morgen
- **Messbar:** "Test X abgeschlossen", nicht "Bisschen arbeiten"
- **Spezifisch:** "Matching Game Test" statt "Bisschen testen"

### **Beispiele:**
```markdown
## 🎯 ZIELE BIS NÄCHSTES STANDUP

### Agent 1:
- [ ] Matching Game Test complete (inkl. Screenshots)
- [ ] DB-Verifizierung Query ausgeführt
- [ ] AGENT-1-SYNC.md erstellt (50% Checkpoint)
```

---

## 📅 STANDUP-SCHEDULE

### **Wann erstellen:**
- **Täglich:** Ende des Arbeitstages (ca. 18:00 CET)
- **Minimum:** Alle 2 Tage (wenn nicht täglich gearbeitet)
- **Bei Blockern:** Sofort (Extra-Update)

### **Wann reviewed:**
- **Master:** Jeden Morgen (09:00 CET)
- **Agents:** Optional (um Status anderer zu sehen)

### **Archivierung:**
- Nach 7 Tagen → `archive/standups/`
- Nur aktuelle Woche im Root

---

## 🛠️ AUTOMATION (Optional)

### **Auto-Create Daily Standup:**
```bash
#!/bin/bash
# scripts/create-standup.sh

DATE=$(date +%Y-%m-%d)
TEMPLATE="DAILY-STANDUP-TEMPLATE.md"
OUTPUT="DAILY-STANDUP-$DATE.md"

if [ ! -f "$OUTPUT" ]; then
  cp "$TEMPLATE" "$OUTPUT"
  # Replace [DATUM] with actual date
  sed -i "" "s/\[DATUM\]/$DATE/g" "$OUTPUT"
  echo "✅ Created: $OUTPUT"
else
  echo "⚠️  Already exists: $OUTPUT"
fi
```

### **Git Hook (Reminder):**
```bash
# .git/hooks/pre-commit

# Check if standup exists for today
DATE=$(date +%Y-%m-%d)
if [ ! -f "DAILY-STANDUP-$DATE.md" ]; then
  echo "⚠️  Reminder: Daily Standup für heute fehlt!"
  echo "   Erstelle: ./scripts/create-standup.sh"
fi
```

---

## ✅ ERFOLGS-KRITERIEN

**Agent-Koordination ist erfolgreich wenn:**
- [ ] Alle Agents nutzen Daily Standups aktiv
- [ ] Master reviewed täglich
- [ ] Blocker werden in <4h gelöst
- [ ] Keine Doppelarbeit
- [ ] 0 Merge-Konflikte durch bessere Kommunikation

---

## 📞 KOMMUNIKATIONS-KANÄLE

### **Asynchron (Preferred):**
- **Daily Standups:** Status-Updates
- **Git Commits:** "standup(agent-X): Update"
- **Dokumentation:** In .md Dateien

### **Synchron (Bei Blockern):**
- **AskUserQuestion Tool:** Bei kritischen Entscheidungen
- **Git Issues:** Für längere Diskussionen
- **Comments in Code:** Für technische Fragen

---

## 📖 QUICK REFERENCE

### **Agent Checklist (Daily):**
- [ ] Standup erstellt/updated
- [ ] Status aktualisiert (%, Ziele)
- [ ] Blocker dokumentiert (falls vorhanden)
- [ ] Committed & pushed

### **Master Checklist (Daily):**
- [ ] Standup reviewed
- [ ] Blocker adressiert
- [ ] Prioritäten kommuniziert
- [ ] Gesamt-Fortschritt aktualisiert

---

## 🎯 NEXT STEPS

**Nach Implementation:**
1. **Alle Agents informieren:** Workflow-Guide lesen
2. **Erstes Standup:** Master erstellt Template
3. **Daily Routine:** Agents füllen täglich aus
4. **Feedback Loop:** Nach 1 Woche evaluieren

**Optimierungen nach 1 Woche:**
- Format anpassen (falls nötig)
- Automation einführen (falls gewünscht)
- Template verbessern

---

**Ende des Workflow-Guides** ✅

**Questions?** Siehe PROJEKT-REFERENZEN.md oder frage Master.
