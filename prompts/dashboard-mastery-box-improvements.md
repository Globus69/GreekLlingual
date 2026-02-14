# GreekLingua – Prompt: Dashboard – Learning Mastery Box pimpen

**Projekt**: GreekLingua (HellenicHorizons)  
**Zweck dieses Prompts**: Die große Learning Mastery Box (links im Dashboard) stark verbessern und motivierender machen  
**Priorität**: Hoch  
**Erstellt**: 21. Januar 2026  
**Status**: An Antigravity gesendet – Ergebnis ausstehend  
**Entwicklungsumgebung**: http://localhost:3001  
**Ziel**: Übersichtliche, elegante Statistik mit Balken, Rating, Vokabeln-Fortschritt – inspiriert von aktueller Box Nr. 5 (dunkel, gelber Header, Glow)

## Anforderungen

1. **Gesamte Zeit**  
   - Groß oben oder unten: „Gesamt gelernt: 14.5 Stunden“ (32px bold weiß)

2. **Aufteilung mit horizontalen Balken**  
   - Drei Balken (Vokabeln, Reading, Listening)  
   - Jeder: dünn (8 px), Gradient (#007AFF → #00C6FF), Prozent-Label rechts  
   - Beispiel: Vokabeln 62 % (blau), Reading 28 % (gelb), Listening 10 % (grün)  
   - Icons links (Buch, Auge, Ohr)

3. **Rating**  
   - Drei kleine Kacheln oder Liste:  
     Last Test: 78 % (grün)  
     Actual Test: 85 % (blau)  
     Last Exam Test: 92 % (gelb)  
   - Mit kleinem Icon (Trophäe oder Kreis) + Datum

4. **Vokabeln to repeat / to learn**  
   - Ein doppelter horizontaler Balken (von links nach rechts):  
     - Links: Grün = Gelernt & stabil (z. B. 187 / 600)  
     - Rechts: Rot/Orange = Noch zu wiederholen/neu (413)  
     - Text darüber: „187 / 600 Vokabeln sicher – 413 brauchen Aufmerksamkeit“  
   - Balken füllt sich grün → rot, mit Prozent-Anteil

5. **Style-Inspiration Box Nr. 5**  
   - Dunkler Hintergrund #1C1C1E, gelber Header-Text (#FFCC00)  
   - Leichter innerer Glow (radial-gradient) um Ring/Balken  
   - Border 1 px #007AFF opacity 0.3  
   - Hover auf Balken/Kacheln: scale 1.03 + Tooltip

Nutze bestehende Klassen (.mastery-box, .progress-ring usw.) + neue für Balken (.mastery-bar, .rating-tile).  
Gib aktualisierten HTML/CSS-Code für .mastery-box + JS für dynamische Balken (statisch 38 % ok, später DB).  
Starte direkt mit dem Code.