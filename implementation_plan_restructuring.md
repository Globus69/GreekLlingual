# Dashboard Restructuring & Mastery Hub Implementation Plan

Restructure the GreekLingua dashboard to provide a more focused, non-scrolling "Liquid Glass" experience. This includes a new visual mastery tracking system and a compact 3x3 action grid.

## User Review Required

> [!IMPORTANT]
> **Viewport Lock**: The application will now be strictly 100vh with no external scrollbars. All scrolling will happen within internal containers (Mastery Box or Action Grid if needed).

## Proposed Changes

### Global Layout & Viewport Lock
#### [MODIFY] [style.css](file:///Users/SWS/DEVELOP/Antigravity/HellenicHorizons-GreekLingua-Dashboard/web/style.css)
- Set `html`, `body`, `#app`, and `.view` to `height: 100vh; overflow: hidden;`.
- Ensure `.dashboard-content` uses `flex: 1` to fill the remaining space.
- Implement `.mastery-box` and `.dashboard-footer-area` styles.
- Add CSS for the **Progress Ring** using `conic-gradient`.

### Dashboard Structural Overhaul
#### [MODIFY] [index.html](file:///Users/SWS/DEVELOP/Antigravity/HellenicHorizons-GreekLingua-Dashboard/web/index.html)
- Restructure `#dashboard-view` contents:
  - Keep `.dashboard-hero`.
  - Replace `.modules-grid` with `.dashboard-footer-area`.
- Implement `.mastery-box` (Left side, 60-65%):
  - Add "Learning Mastery" header.
  - Integrate Progress Ring SVG/CSS.
  - Add Mini-tiles for Streak, Word count, and Weak spots.
- Implement `.quick-actions-grid` (Right side, 35-40%):
  - 3x3 grid layout.
  - 9 specific tiles with icons and text.

### Logic Synchronization
#### [MODIFY] [script.js](file:///Users/SWS/DEVELOP/Antigravity/HellenicHorizons-GreekLingua-Dashboard/web/script.js)
- Update any navigation logic that relied on the old `.modules-grid` structure.
- Ensure the progress ring percentage (38%) is reflected in the UI.

## Verification Plan

### Automated Tests
- None currently available for the web prototype.

### Manual Verification
1. **Viewport Check**: Open the dashboard and verify that no scrollbar appears on the body, even when resizing the window.
2. **Mastery Box Layout**: Confirm the "Learning Mastery" box displays correctly on the left with the progress ring and mini-tiles.
3. **Quick Actions Grid**: Verify the 3x3 grid on the right has exactly 9 buttons with the correct icons and hover effects.
4. **Responsive Check**: Use browser tools to simulate <768px width and verify the layout stacks vertically.
5. **Interactive Check**: Click on "Vokabeln wiederholen" in the grid and verify it still navigates to the flashcard view.
