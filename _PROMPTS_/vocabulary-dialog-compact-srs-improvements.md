# GreekLingua – Prompt: Vokabeln-Modul – Kompakter Dialog + SRS-Verbesserungen

**Projekt**: GreekLingua (HellenicHorizons)  
**Zweck dieses Prompts**: Das Vokabeln-Modul von full-view auf einen kompakten, modalen Dialog umstellen + SRS-Funktionalität stark verbessern (Zähler, Buttons, Übergänge, Fortschritt, Beenden + Speichern)  
**Priorität**: Hoch  
**Erstellt**: 21. Januar 2026  
**Status**: An Antigravity gesendet – Ergebnis ausstehend  
**Entwicklungsumgebung**: Läuft aktuell auf http://localhost:3001 (npm run dev -p 3001)  
**Ziel**: Ergonomisches, motivierendes Lernen in kleinem, übersichtlichem Fenster; nahtlose Rückkehr zum Dashboard mit gespeichertem Stand

## Anforderungen

1. **Kompakter Dialog statt full-view**  
   - Beim Klick auf „Vokabeln“ (im Dashboard-Grid) öffnet sich ein zentrierter Dialog (z. B. mit backdrop-blur, border-radius 28px, width 640–720px, height auto/max 80vh)  
   - Nicht full-screen – viel Weißraum drumherum, dunkler Overlay-Hintergrund (opacity 0.7–0.85)  
   - Close-Button (×) oben rechts + separater „Beenden & Speichern“-Button unten

2. **Zähler & Feedback-Anzeige (oben)**  
   - „Karte 1 von 12“ (aktuelle / fällige heute)  
   - Bewertungs-Zähler: Hard: 3 | Good: 8 | Easy: 1  
   - Richtig/Falsch-Gesamt: 11/1 (oder pro Session)  
   - Alles in einer kleinen, abgerundeten Leiste (z. B. bg #1C1C1E, padding 12px, flex row)

3. **Ergonomische Zurück/Weiter + Bewertung**  
   - Unten feste Button-Bar (3 Buttons nebeneinander):  
     ← Zurück (outline, grau)  
     Hard / Good / Easy (primär, gefüllt in 3 Farben: rot/orange/grün oder einheitlich #007AFF mit Textfarbe)  
     Weiter → (outline, blau)  
   - Klick auf Hard/Good/Easy → sofort nächste Karte laden + Bewertung speichern (kein extra „Weiter“ nötig)  
   - Zurück/Weiter manuell möglich (für Review)

4. **Schöner Übergang zwischen Karten**  
   - Fade-Out alte Karte (opacity 0, 300ms)  
   - Fade-In neue Karte (opacity 1, 400ms)  
   - Optional: leichter Slide (translateX 20px → 0) oder Scale (0.95 → 1) für natürliches Gefühl

5. **Fortschrittsbalken für Motivation**  
   - Dünner, horizontaler Balken oben oder unten (height 6–8px, bg #3A3A3C, fill #007AFF → #00C6FF Gradient)  
   - Füllung = (richtig / gesamt) oder (bearbeitete / fällige)  
   - Prozent-Text daneben (z. B. „68 % heute erledigt“)

6. **Beenden-Button**  
   - Unten links/rechts: „Beenden & Speichern“ (gefährlich rot oder neutral grau)  
   - Speichert aktuellen Stand in Supabase (student_progress upsert)  
   - Schließt Dialog → zurück zum Dashboard  
   - Optional: Toast „Fortschritt gespeichert“

7. **Statistik im Dashboard aktualisieren**  
   - Nach Beenden: Mastery-Box (Progress-Ring), Performance-Hub (Streak, Words this week, Weak point) und Today-Vorschlag updaten  
   - Nutze Supabase Realtime oder einfaches Fetch nach Rückkehr

**Technische Hinweise**  
- Supabase: Lade aus learning_items (type='vocabulary'), update student_progress (correct_count, attempts, next_review)  
- SRS-Logik: Hard → interval 1 Tag, Good → ×2.5, Easy → ×3  
- Design: Nutze bestehende Klassen (.card, .flipped, .control-btn, .progress-container usw.) + neue für Dialog (.vocabulary-dialog, .rating-bar, .progress-bar)  
- Responsive: Dialog auf Mobile max-width 90vw

Gib vollständigen Code (HTML-Struktur für Dialog, CSS für neue Klassen, JavaScript für Laden/Speichern/Animationen).  
Starte direkt mit dem Code.