- **Vokabeln SRS + Supabase**  
  Aufgabe: Implementiere das Vokabeln-Modul vollständig mit Supabase + SRS.
  Datei: `vocabulary-srs-supabase-2026-01-21.md`  
  Status: in Arbeit


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