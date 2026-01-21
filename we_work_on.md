# GreekLingua Development Protocol & Todo List

## Current Status
- Dashboard layout is functional in Next.js.
- Supabase integration is initialized.
- Unified "Liquid Glass" design system is established.

## Project Protocol (21.01.2026)
- **Objective**: Implement the functional "Vokabeln" (Vocabulary) module.
- **Goal**: Transition from static tiles to a dynamic, Supabase-backed flashcard system with Spaced Repetition (SRS).
- **Design Directive**: Maintain macOS Dark Mode aesthetics, high white space, and specific CSS class usage for consistency.

## TODO List

### 1. Database Alignment
- [ ] Verify/Create `learning_items` and `student_progress` tables in Supabase (as requested).
- [ ] Populate `learning_items` with sample vocabulary data.

### 2. Vokabeln Module Implementation
- [x] Create/Update `vocabulary-view` component/logic.
- [x] Implement dynamic data fetching from `learning_items` (LIMIT 20, ordered by `next_review`).
- [x] Build interactive Flashcard logic (English -> Greek).
- [x] Implement Flip Animation (`.flipped` class).
- [x] Add Rating Buttons (Schwer, Gut, Sehr gut).

### 3. SRS Logic (Spaced Repetition System)
- [x] Implement "Schwer" -> Interval reset (1 day).
- [x] Implement "Gut" -> Interval × 2.5.
- [x] Implement "Sehr gut" -> Interval × 3.
- [x] Implement `upsert` logic for `student_progress` tracking.

### 4. UI & Navigation
- [x] Implement `.back-btn` logic to return to Dashboard.
- [x] Add progress indicator ("X/Y fällig").
- [x] Ensure seamless transition between `.view` elements.

### 6. Debug & Layout Audit
- [x] Implement Debug Mapping (Numbers for Frames/Flex/Grid).
- [x] Visual Audit: Verify containment and alignment.

## Phase 4: Mastery Hub & Layout Refinement (ACTIVE)
- [ ] Implement Viewport Lock (100vh, no scroll).
- [ ] Restructure Dashboard Footer Area (Mastery Box + Quick Actions).
- [ ] Create Mastery Box (Progress Ring + Mini Tiles).
- [ ] Implement 3x3 Quick Actions Grid.
- [ ] Responsive Design Audit (<768px).











# New - Grid und Statistik

Du arbeitest an GreekLingua – einer Web-Lern-App mit macOS-ähnlichem Dark-Mode-Design (bestehende CSS nutzen: #0F0F11 bg, #1C1C1E cards, #007AFF Akzent, system-ui Font, backdrop-blur, radius 24–28px, sanfte Shadows/Transitions).

Aktueller Stand:
- Dashboard hat .app-header (sticky), .dashboard-hero (flex mit stats-card + action-area), .dashboard-grid (unten, auto-fill minmax(240px,1fr))

Aufgabe: Verfeinere das Dashboard so, dass es nie einen Viewport-Scrollbar hat (immer 100vh, overflow: hidden auf body/html). Der untere Bereich (nach Hero) wird neu strukturiert:

1. **Kein Scrollbar im Viewport**:
   - body, html, #app, .view.active { height: 100vh; overflow: hidden; }
   - .dashboard-grid und neuer unterer Bereich bekommen flex: 1 + overflow-y: auto nur intern, falls Inhalt zu lang.

2. **Neuer unterer Bereich (nach .dashboard-hero)**:
   - Container: .dashboard-footer-area oder ähnlich, display: flex, gap: 32px, padding: 0 60px 40px 60px, height: calc(100vh - header - hero - padding), flex: 1
   - Links (60–65% Breite): Eine große Box (.mastery-box), background #1C1C1E, radius 28px, padding 40px, box-shadow wie .stats-card
     - Inhalt:
       - Oben: "Learning Mastery" (32px bold) + großer Progress-Ring (z. B. SVG oder CSS conic-gradient, 38% zum B1-Ziel)
       - Mitte: "Performance Hub" – 3–4 kleine Mini-Kacheln (flex row-wrap, z. B. Streak 5 Days, Wörter diese Woche 47, Schwachstelle: Verben)
       - Unten: Today-Vorschlag (italic/grau, 14px: "Heute: 12 neue Vokabeln + 1 Text über Zypern")
   - Rechts (35–40% Breite): 3×3 Grid-Box (.quick-actions-grid), grid-template-columns: repeat(3, 1fr), gap: 20px
     - 9 kompakte Buttons/Kacheln (160–180px quadratisch oder 1:1.2), radius 20px, background #1C1C1E, hover: scale 1.03 + shadow
     - Beispiele für die 9 Felder (mit Icon + kurzem Text):
       1. Magic Round (primär #007AFF)
       2. 20 min Quick Lesson
       3. Vokabeln wiederholen
       4. Heutige Due Cards
       5. Schwache Wörter trainieren
       6. Zypern Prüfungssimulation
       7. Phrasen des Tages
       8. Audio-Immersion
       9. Lesen & Schreiben
     - Buttons: flex column, Icon 40px oben, Text 14px unten, center

Responsive: Bei <768px → flex-direction: column, Grid links/rechts stacken, Grid rechts 2 Spalten oder 1.

Nutze bestehende Klassen wo möglich (.tile-Style für Buttons, .stats-card-Ästhetik für linke Box).  
Gib vollständigen aktualisierten HTML-Struktur-Code für .dashboard-hero + neuen unteren Bereich (im .view#dashboard), plus neue/ergänzte CSS-Klassen.  
Starte direkt mit dem Code.