# GreekLingua – Prompt: Vokabeln-Dialog – Fix & Kompakt Version 3

**Projekt**: GreekLingua (HellenicHorizons)  
**Zweck dieses Prompts**: Das Vokabeln-Modul auf einen wirklich kompakten, eleganten Dialog bringen, Doppel-Buttons entfernen, kein automatisches Schließen, Speicher-Hinweis hinzufügen, Motivation & Ergonomie verbessern.  
**Priorität**: Hoch  
**Erstellt**: 21. Januar 2026  
**Status**: An Antigravity gesendet – Ergebnis ausstehend  
**Entwicklungsumgebung**: http://localhost:3001 (npm run dev -p 3001)  
**Ziel**: Kleiner, fokussierter Dialog (ca. 480–520 px breit), nur eine Button-Reihe, flüssig, motivierend, kein unnötiger Platz

## Kritik & Anforderungen

1. **Fenster zu groß** → Kompakt machen: width 480–520 px, height auto (max 55vh), viel Padding innen (24–32 px), zentriert mit dunklerem Overlay (opacity 0.9). Karte selbst max 420×280 px.

2. **Bewertungsbuttons doppelt** → Entfernen der oberen Zähler-Anzeige. Nur die 3 Buttons unten: Hard (rot #FF453A), Good (gelb #FFCC00), Easy (grün #34C759), gefüllt, abgerundet (radius 16px), gleich groß.

3. **Kein automatisches Schließen** → Nach letzter Karte bleibt der Dialog offen. Zeige Feedback-Screen: „Session beendet – X richtig / Y falsch (Z %)“ + großer „Zurück zum Dashboard“-Button.

4. **Speicher-Hinweis** → Beim Klick auf „Beenden & Speichern“ oder „Zurück“ → Toast „Fortschritt gespeichert – super gemacht!“ (2–3 s, fade-in/out, nutze .toast-Klasse).

Zusätzlich:
- Buttons ergonomisch: Hard/Good/Easy → Klick → sofort nächste Karte + Bewertung speichern (kein extra Next nötig)  
- Zurück/Weiter: Kleine Pfeile links/rechts der Karte (outline, blau)  
- Übergang: Sanfter Fade + leichter Scale (0.95 → 1, 300ms)  
- Fortschrittsbalken: Dünn (6 px), Gradient (#007AFF → #00C6FF), mit Prozent-Text daneben  
- Close-Button (×) oben rechts + separater „Beenden & Speichern“ unten (grau/rot)

Nutze bestehende Klassen (.card, .flipped, .control-btn, .toast usw.) + neue für Dialog (.vocabulary-dialog-compact, .rating-buttons-compact).  
Gib aktualisierten Code (HTML-Struktur, CSS-Ergänzungen, JS für Logik/Animationen/Speichern/Toast). Starte direkt mit dem Code.