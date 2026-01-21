# GreekLingua – Prompt: Vokabeln-Dialog – Fix & Kompakt Version 4

**Projekt**: GreekLingua (HellenicHorizons)  
**Zweck dieses Prompts**: Den Vokabeln-Dialog noch kompakter, fokussierter und eleganter machen – kleineres Fenster, bessere Proportionen, keine doppelten Elemente, manuelles Schließen  
**Priorität**: Hoch  
**Erstellt**: 21. Januar 2026  
**Status**: An Antigravity gesendet – Ergebnis ausstehend  
**Entwicklungsumgebung**: http://localhost:3001  
**Ziel**: Eleganter, kleiner Pop-up-Dialog (460–500 px breit), Karte perfekt proportioniert, intuitiv & motivierend

## Anforderungen

1. **Noch kompakterer Dialog**  
   - Width 460–500 px, height auto (max 55vh), zentriert  
   - Dunkleres Overlay (opacity 0.9), starker Blur (backdrop-filter: blur(12px))  
   - Padding innen 24 px, Karte max 420×280 px

2. **Karte schlanker & fokussiert**  
   - „ENGLISH“: 12–14 px uppercase grau  
   - Wort: 48–56 px bold weiß  
   - Beispiel-Satz: 16 px italic grau  
   - „Click to flip“: 12 px, opacity 0.7, dezent unten

3. **Bewertungs-Buttons nur einmal**  
   - Unten: 3 Buttons nebeneinander (Hard rot #FF453A, Good gelb #FFCC00, Easy grün #34C759)  
   - Height 48 px, radius 16 px, Icons (↓ Hard, → Good, ↑ Easy) + Text  
   - Klick → sofort nächste Karte + Bewertung speichern (upsert student_progress)

4. **Zähler oben dezent**  
   - Nur „Card 1/3“ (14 px grau) + dünner Fortschrittsbalken (6 px, Gradient #007AFF → #00C6FF)  
   - Keine doppelte Hard/Good/Easy-Anzeige oben

5. **Manuelles Schließen**  
   - Nach letzter Karte: Feedback „Fertig! 3/3 bewertet – X richtig“ + großer „Zurück zum Dashboard“-Button  
   - Close-Button (×) oben rechts + „Beenden & Speichern“ unten mittig (grau/rot)

6. **Speicher-Hinweis**  
   - Beim Schließen Toast: „Fortschritt gespeichert – super gemacht!“ (2–3 s, .toast-Klasse)

7. **Übergang & Ergonomie**  
   - Fade + leichter Scale (0.95 → 1, 300ms) zwischen Karten  
   - Zurück/Weiter als kleine Pfeile links/rechts der Karte (outline blau)

Nutze bestehende Klassen (.card, .flipped, .control-btn, .toast, .back-btn usw.) + neue für Dialog (.vocabulary-dialog-compact-v4, .rating-buttons-compact, .progress-bar-thin).  
Gib aktualisierten Code (HTML für Dialog-Struktur, CSS für neue Klassen, JS für Logik/Animationen/Speichern/Toast). Starte direkt mit dem Code.