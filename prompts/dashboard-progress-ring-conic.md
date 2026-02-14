# GreekLingua – Prompt: Dashboard – Styling des Progress-Rings (conic-gradient)

**Projekt**: GreekLingua (HellenicHorizons)  
**Zweck dieses Prompts**: Schöner, macOS-ähnlicher Fortschrittsring in der .mastery-box (Learning Mastery), mit conic-gradient, Prozent-Anzeige und Text, später dynamisch via JS  
**Priorität**: Hoch  
**Erstellt**: 21. Januar 2026  
**Status**: An Antigravity gesendet – Ergebnis ausstehend  
**Entwicklungsumgebung**: Läuft aktuell auf http://localhost:3001 (npm run dev -p 3001)  
**Ziel**: Visuell ansprechender Ring (blauer Gradient), Integration in .mastery-box, responsive Skalierung

## Prompt-Inhalt (kopiert und an Antigravity gesendet)


Du arbeitest an GreekLingua Dashboard – speziell am Progress-Ring in der .mastery-box (Learning Mastery).

Aufgabe: Implementiere einen schönen, macOS-ähnlichen Progress-Ring mit conic-gradient (aktuell 38 % zum B1-Ziel).

**Anforderungen:**
- Ring: Kreis (z. B. 120–160 px Durchmesser), conic-gradient für Fortschritt
- Farben: Hintergrund-Ring grau (#3A3A3C), Fortschritt blau (#007AFF → #00C6FF Gradient)
- Text in der Mitte: "38%" (48px bold weiß) + "zum B1-Ziel" (14px grau)
- Optional: Leichter Glow oder Schatten für Glassmorphism-Feeling
- Integriere in .mastery-box (oben "Learning Mastery" 32px bold)
- Mach es statisch (38 %), später dynamisch via JS
- Responsive: Skaliert bei <768px
- Nutze reine CSS (conic-gradient + mask oder SVG falls nötig)

Gib vollständigen CSS-Code für den Progress-Ring (neue Klasse z. B. .progress-ring) + HTML-Struktur-Beispiel für .mastery-box.  
Starte direkt mit dem Code.