# GreekLingua – Prompt: Vokabeln-Dialog – Verbesserungen (kompakter, ergonomisch, Feedback)

**Projekt**: GreekLingua (HellenicHorizons)  
**Zweck dieses Prompts**: Vokabeln-Dialog kompakter machen, doppelte Buttons entfernen, Schließen manuell, Speicher-Hinweis hinzufügen + weitere Ergonomik-Verbesserungen  
**Priorität**: Hoch  
**Erstellt**: 21. Januar 2026  
**Status**: An Antigravity gesendet – Ergebnis ausstehend  
**Entwicklungsumgebung**: Läuft auf http://localhost:3001  
**Ziel**: Intuitives, motivierendes Lernen in kleinem Dialog, ohne Überladung

## Anforderungen

1. **Kompakter Dialog**: Width 480–560 px, height auto (max 60vh), zentriert mit stärkerem Overlay (opacity 0.85), mehr Weißraum innen – passt zum Inhalt (Karte + Buttons)

2. **Doppelte Buttons entfernen**: Nur Hard/Good/Easy im Dialog (gefärbt: rot/gelb/grün), Zurück/Weiter als Pfeile links/rechts von der Card (klein, outline)

3. **Kein automatisches Schließen**: Nach letzter Vokabel: Feedback-Screen „Session abgeschlossen! X richtig / Y falsch“ + Button „Zurück zum Dashboard“ (manuell)

4. **Speicher-Hinweis**: Beim Schließen Toast (.toast-Klasse): „Ergebnis gespeichert – gut gemacht!“ (fade-in/out, 3s)

Zusätzlich:
- Übergang: Fade + slide (300ms) zwischen Karten
- Fortschrittsbalken: Dünner, Gradient (#007AFF → #00C6FF), neben Zähler (1 von X, Hard X, Good Y, Easy Z, Richtig/Falsch)
- Design: Nutze bestehende Klassen, viel Weißraum, sanfte Hover

Gib aktualisierten Code (HTML für Dialog, CSS-Ergänzungen, JS für Logik/Animationen/Speichern). Starte direkt mit dem Code.