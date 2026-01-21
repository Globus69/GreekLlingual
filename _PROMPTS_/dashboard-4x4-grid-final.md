Du arbeitest weiter an GreekLingua Dashboard (aktueller Code mit .dashboard-hero, .mastery-box, .quick-actions-grid usw.).

Aufgabe: Finalisiere den rechten Bereich als 4×4 Grid (16 Felder) – kompakt, harmonisch, kein Überladen.

**Anforderungen:**
- Rechter Teil (.quick-actions-grid): grid-template-columns: repeat(4, 1fr); grid-template-rows: repeat(4, 1fr);
- Jede Kachel: 140–160 px quadratisch, radius 20px, bg #1C1C1E, hover scale 1.03 + shadow
- Inhalt: Icon (40–48px) oben zentriert + Text (13–14px) unten zentriert
- Gap: 16–20px
- Responsive: <768px → repeat(2, 1fr) oder repeat(3, 1fr), stacken bei sehr klein
- Linke Mastery-Box bleibt 60–65 % Breite
- Gesamthöhe in 100vh, kein Viewport-Scrollbar
- 16 Beispiele (mit passenden Icons):
  1. Magic Round (✨)
  2. 20 min Quick Lesson (⚡)
  3. Review Vocabulary (🔄)
  4. Due Cards Today (📅)
  5. Train Weak Words (⚠️)
  6. Cyprus Exam Sim (🏛️)
  7. Daily Phrases (💬)
  8. Audio Immersion (🎧)
  9. Read & Write (📖✍️)
  10. Short Stories (📚)
  11. Listening Practice (👂)
  12. Pronunciation Trainer (🗣️)
  13. Grammar Quick Hits (📐)
  14. Conversation Starters (🗨️)
  15. Book Recommendations (📕)
  16. Progress History (📊)

Gib aktualisierten HTML-Code für den rechten Grid-Bereich + neue/ergänzte CSS-Klassen.  
Nutze bestehende .tile-Style wo möglich. Starte direkt mit dem Code.