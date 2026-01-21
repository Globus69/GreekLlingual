# GreekLingua – Prompt: Vokabeln-Modul mit SRS + Supabase-Anbindung

**Projekt**: GreekLingua (HellenicHorizons)  
**Zweck dieses Prompts**: Vollständige Implementierung des Vokabeln-Moduls mit dynamischem Laden aus Supabase, Flip-Cards, Bewertung (Schwer/Gut/Sehr gut) und einfachem Spaced-Repetition-System (SRS)  
**Priorität**: Hoch  
**Erstellt**: 21. Januar 2026  
**Status**: An Antigravity gesendet – Ergebnis ausstehend  
**Entwicklungsumgebung**: Läuft aktuell auf http://localhost:3001 (npm run dev -p 3001)  
**Ziel**: Nahtlose Integration in bestehende .view#vocabulary-view, Wiederverwendung von .card, .flipped, .control-btn Klassen

## Prompt-Inhalt (kopiert und an Antigravity gesendet)

Du arbeitest an GreekLingua – einer Web-Lern-App (HTML/CSS/JS + Supabase).

Aktueller Stand:
- Dashboard ist fertig (macOS-Dark-Mode, kein Scrollbar, Hero + Mastery-Box + Quick-Actions-Grid)
- Supabase-Client ist global verfügbar (window.supabase)
- Bestehende Klassen: .view#vocabulary-view, .card-area, .card-wrapper, .card, .card-face, .main-word, .example-sentence, .controls-bar, .control-btn.primary / .outline, .back-btn, .progress-container

Aufgabe: Implementiere das Vokabeln-Modul vollständig mit Supabase + SRS.

**Anforderungen:**
- Bei Klick auf Tile „Vokabeln“ → .view#vocabulary-view aktivieren
- Lade Vokabeln dynamisch aus Supabase:  
  SELECT * FROM learning_items WHERE type = 'vocabulary' ORDER BY next_review ASC LIMIT 20
- Zeige als Flip-Cards (bereits vorhandene .card + .flipped Klasse nutzen)
  - Vorderseite: english + example_en (falls vorhanden)
  - Rückseite: greek + example_gr
- Nach Flip: Bewertungs-Buttons „Schwer“ / „Gut“ / „Sehr gut“ (.control-btn.outline + .primary)
- Bei Bewertung: upsert in student_progress
  - correct_count, attempts, last_attempt = now()
  - next_review = last_attempt + interval (Tage)
  - SRS-Logik (einfach):
    - Schwer → interval = 1 Tag, correct_count reset oder -1
    - Gut → interval = interval × 2.5
    - Sehr gut → interval = interval × 3
    - Start-Interval (neue Karte): 1 Tag
- Zeige Fortschritt: "X von Y heute fällig" in .progress-container
- Zurück-Button → zurück zu Dashboard
- Design: Nutze bestehende Klassen, viel Weißraum, gleiches Farbschema

Gib vollständigen JavaScript-Code (async/await für Supabase) + eventuelle kleine CSS-Ergänzungen.  
Sauber kommentiert. Starte direkt mit dem Code.