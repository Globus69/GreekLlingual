# PWA Icons - GreekLingua

## Required Icons

Die folgenden Icon-Dateien müssen im `public/` Ordner erstellt werden:

### 1. **icon-192.png** (192x192 px)
- **Format:** PNG
- **Größe:** 192x192 pixels
- **Verwendung:** Android Home Screen, Splash Screen
- **Design:**
  - Hintergrund: Gradient (Blau-Lila: #667eea → #764ba2)
  - Icon: Weißes "Γ" (Gamma, griechischer Buchstabe) oder "🏛️"
  - Padding: 20px auf allen Seiten
  - Abgerundete Ecken: Optional (wird vom OS gehandhabt)

### 2. **icon-512.png** (512x512 px)
- **Format:** PNG
- **Größe:** 512x512 pixels
- **Verwendung:** Android Splash Screen, PWA Install Dialog
- **Design:** Gleich wie icon-192.png, aber höhere Auflösung

### 3. **icon-apple-touch.png** (180x180 px)
- **Format:** PNG
- **Größe:** 180x180 pixels
- **Verwendung:** iOS Home Screen
- **Design:** Gleich wie icon-192.png
- **Wichtig:** iOS fügt automatisch abgerundete Ecken hinzu

---

## Quick Icon Generation

### Option A: Figma/Canva (Empfohlen)
1. Canvas erstellen: 512x512 px
2. Hintergrund: Linear Gradient
   - Start: #667eea (oben links)
   - End: #764ba2 (unten rechts)
3. Text hinzufügen:
   - Schriftart: SF Pro Display Bold oder Helvetica Bold
   - Zeichen: "Γ" (Gamma)
   - Farbe: Weiß (#FFFFFF)
   - Größe: ~320px
   - Zentriert
4. Export:
   - 512x512 → `icon-512.png`
   - 192x192 → `icon-192.png`
   - 180x180 → `icon-apple-touch.png`

### Option B: Online PWA Icon Generator
1. Besuche: https://www.pwabuilder.com/imageGenerator
2. Upload ein 512x512 Base-Icon
3. Download alle generierten Icons
4. Kopiere nach `public/`:
   - `icon-192.png`
   - `icon-512.png`
   - `icon-apple-touch.png`

### Option C: ImageMagick CLI
```bash
# Erstelle Gradient-Hintergrund + Text
convert -size 512x512 \
  gradient:'#667eea-#764ba2' \
  -gravity center \
  -pointsize 320 \
  -fill white \
  -font "SF-Pro-Display-Bold" \
  -annotate +0+0 "Γ" \
  icon-512.png

# Resize für kleinere Versionen
convert icon-512.png -resize 192x192 icon-192.png
convert icon-512.png -resize 180x180 icon-apple-touch.png
```

---

## Screenshots (Optional)

Für bessere PWA-Installation-UX:

### dashboard.png (1280x720 px)
- Screenshot des Dashboards (Desktop-Ansicht)
- Zeigt: Stats, Module Grid, Vocabulary Widget

### flashcard.png (750x1334 px)
- Screenshot des Vocabulary-Dialogs (Mobile-Ansicht)
- Zeigt: Flashcard mit FSRS-Buttons

Platziere Screenshots in `public/screenshots/`.

---

## Verification

Nach Icon-Erstellung:
1. Icons nach `public/` kopieren
2. App neu starten: `npm run dev`
3. Browser DevTools öffnen → Application → Manifest
4. **Erwartung:**
   - Manifest URL: `/manifest.json`
   - Icons: 3 icons erkannt
   - "Add to Home Screen" verfügbar (Chrome Mobile)

---

## Farben & Design-System

**Brand Colors (aus Projekt):**
- Primary Gradient: `#667eea → #764ba2`
- Background Dark: `#1a1a1e`
- Text White: `#ffffff`
- Accent Blue: `#007AFF`

**Typography:**
- Griechisches Zeichen: Γ (Gamma) - symbolisiert "Greek"
- Alternative: 🏛️ (Griechischer Tempel Emoji)

---

**Status:** Icons müssen manuell erstellt werden (siehe Optionen oben)
**Priority:** MEDIUM (PWA funktioniert ohne Icons, aber UX ist besser mit Icons)
