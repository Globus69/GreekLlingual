# VOCAB UI Reference - Complete Style Guide

**Date:** 2026-02-18
**Purpose:** This document serves as the SINGLE SOURCE OF TRUTH for admin page styling across `/admin/vocab`, `/admin/content`, and `/admin/daily-phrases`.

---

## 🎨 DESIGN SYSTEM

### Core Colors
```typescript
Background: 'linear-gradient(135deg, #0a0a1a 0%, #0f1a3e 50%, #0a0a1a 100%)'
Text Primary: '#fff'
Text Secondary: '#8E8E93'
Text Muted: '#636366'

Primary Blue: '#007AFF'
Primary Blue BG: 'rgba(0, 122, 255, 0.15)'
Primary Blue Border: 'rgba(0, 122, 255, 0.3)'

Success Green: '#34C759'
Warning Yellow: '#FFD60A'
Error Red: '#FF3B30'

Card BG: 'rgba(255,255,255,0.04)'
Card Border: 'rgba(255,255,255,0.08)'
Input BG: 'rgba(255,255,255,0.04)'
Input Border: 'rgba(255,255,255,0.1)'
```

### Typography
```typescript
Page Title: 32px, 700 weight
Subtitle: 14px, #8E8E93
Section Title: 16px, 700 weight
Card Label: 13px, #8E8E93
Button Text: 14px, 600 weight
Input Text: 14px
Table Header: 11px, 600 weight, uppercase, #8E8E93
Table Cell: 13px
```

### Spacing
```typescript
Page Padding: 24px
Card Padding: 20px (stats), 24px (sections)
Card Gap: 16px
Button Padding: 12px 20px
Input Padding: 12px
Border Radius: 12px (buttons/cards), 16px (sections), 20px (modals)
```

---

## 📋 PAGE STRUCTURE

### 1. Loading State
```typescript
<div style={{
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0a0a1a 0%, #0f1a3e 50%, #0a0a1a 100%)',
    color: '#fff',
}}>
    <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>📚</div>
        <p style={{ fontSize: '16px', color: '#8E8E93' }}>Loading...</p>
    </div>
</div>
```

### 2. Main Container
```typescript
<div style={{
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0a1a 0%, #0f1a3e 50%, #0a0a1a 100%)',
    color: '#fff',
    padding: '24px',
}}>
```

### 3. Header Section
```typescript
<header style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '32px',
    flexWrap: 'wrap',
    gap: '16px',
}}>
    <div>
        <h1 style={{ fontSize: '32px', fontWeight: 700, marginBottom: '8px' }}>
            📚 Vocabulary Management
        </h1>
        <p style={{ fontSize: '14px', color: '#8E8E93' }}>
            {total} entries • Multilingual (EN, DE, ES, RU)
        </p>
    </div>
    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {/* Buttons */}
    </div>
</header>
```

---

## 🔘 BUTTON STYLES

### Primary Button
```typescript
{
    background: 'rgba(0, 122, 255, 0.15)',
    border: '1px solid rgba(0, 122, 255, 0.3)',
    borderRadius: '12px',
    padding: '12px 20px',
    color: '#007AFF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
}
```

### Secondary Button
```typescript
{
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '12px 20px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
}
```

### Delete Button
```typescript
{
    background: 'rgba(255, 59, 48, 0.15)',
    border: '1px solid rgba(255, 59, 48, 0.3)',
    borderRadius: '12px',
    padding: '12px 20px',
    color: '#FF3B30',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
}
```

---

## 📊 STATS COMPONENT

### Layout
- Grid: `repeat(auto-fit, minmax(200px, 1fr))`
- Gap: `16px`
- Margin Bottom: `24px`

### Stat Card
```typescript
{
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
}
```

**Content:**
- Icon: `32px`, margin-bottom `8px`
- Value: `28px`, `700` weight, colored
- Label: `13px`, `#8E8E93`, margin-top `4px`

### Stat Cards (4 total):
1. **Total Entries** - 📚, #007AFF
2. **Avg Frequency** - 📊, #5856D6, suffix "★"
3. **EN Audio Coverage** - 🔊, #34C759, percentage
4. **Ready to Practice** - 🎯, #FF9500

### Level Distribution Chart
- Grid: `repeat(6, 1fr)`, gap `12px`
- Bar colors: A1=#34C759, A2=#30D158, B1=#64D2FF, B2=#0A84FF, C1=#BF5AF2, C2=#AF52DE
- Bar height: `80px` container, dynamic content height
- Label: `12px`, `600` weight, same color as bar

### Difficulty Distribution
- Grid: `repeat(3, 1fr)`, gap `12px`
- Colors: Easy=#34C759, Medium=#FFD60A, Hard=#FF3B30
- Horizontal bars: `8px` height

### Audio Coverage
- Vertical list, gap `12px`
- Languages: EN, DE, ES, RU
- Progress bars: `8px` height
- Color logic: ≥75%=#34C759, ≥50%=#FFD60A, else=#FF9500

---

## 🔍 FILTERS SECTION

```typescript
<div style={{
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '16px',
    padding: '20px',
    border: '1px solid rgba(255,255,255,0.08)',
    marginBottom: '24px',
}}>
    <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '12px',
    }}>
        {/* Search input */}
        {/* Level dropdown */}
        {/* Difficulty dropdown */}
        {/* Clear filters button */}
    </div>
</div>
```

### Input/Select Style
```typescript
{
    padding: '12px',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)',
    color: '#fff',
    fontSize: '14px',
    width: '100%',
}
```

---

## 📋 TABLE COMPONENT

### Container
```typescript
{
    overflowX: 'auto',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.12)',
}
```

### Table Style
```typescript
{
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '1400px',
}
```

### Column Structure (13 columns):
1. Checkbox
2. Nr
3. Greek
4. Phonetic
5. EN
6. DE
7. ES
8. RU
9. Level
10. Difficulty
11. Frequency
12. Audio
13. Actions

### Header Style
```typescript
{
    padding: '16px 12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    color: '#8E8E93',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.12)',
    background: 'rgba(255,255,255,0.02)',
}
```

### Row Style
```typescript
{
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    transition: 'background 0.2s',
}
```

### Cell Style
```typescript
{
    padding: '12px',
    fontSize: '13px',
    color: '#FFFFFF',
    verticalAlign: 'middle',
}
```

### Level Badge
```typescript
{
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: 600,
    background: '{LEVEL_COLOR}20',
    color: LEVEL_COLOR,
    border: `1px solid {LEVEL_COLOR}40`,
}
```

### Difficulty Badge
Same as Level Badge, but with DIFFICULTY_COLOR

### Frequency Display
```typescript
{
    color: '#FFD60A',
    fontSize: '14px',
    fontWeight: 600,
}
// Shows: ★★★☆☆ (based on 1-5 value)
```

### Audio Icons
```typescript
{
    display: 'flex',
    gap: '4px',
    fontSize: '12px',
}
// Icons: 🔊 (has audio, opacity 1) or 🔇 (no audio, opacity 0.3)
```

### Action Buttons
```typescript
// Edit Button
{
    background: 'rgba(0, 122, 255, 0.12)',
    border: '1px solid rgba(0, 122, 255, 0.25)',
    borderRadius: '6px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
}

// Delete Button
{
    background: 'rgba(255, 59, 48, 0.12)',
    border: '1px solid rgba(255, 59, 48, 0.25)',
    borderRadius: '6px',
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s',
}
```

### Empty State
```typescript
{
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '80px 20px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.12)',
}
// Icon: 48px
// Title: 18px, 700, #FFFFFF
// Text: 14px, #8E8E93
```

---

## 📄 PAGINATION

```typescript
<div style={{
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    marginTop: '24px',
}}>
    <button style={secondaryButtonStyle}>Previous</button>
    <span style={{
        padding: '12px 24px',
        background: 'rgba(255,255,255,0.04)',
        borderRadius: '12px',
        fontSize: '14px',
    }}>
        Page {page} / {totalPages}
    </span>
    <button style={secondaryButtonStyle}>Next</button>
</div>
```

Disabled state:
```typescript
{
    ...secondaryButtonStyle,
    opacity: 0.5,
    cursor: 'not-allowed',
}
```

---

## 🎭 MODALS

### Create/Edit Modal

**Overlay:**
```typescript
{
    position: 'fixed',
    top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
}
```

**Modal Container:**
```typescript
{
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '20px',
    maxWidth: '800px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
}
```

**Header:**
```typescript
{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
}
// Title: 24px, 700, #fff
// Close button: transparent bg, #8E8E93, 24px
```

**Form Body:**
```typescript
{
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
}
```

**Field Structure:**
```typescript
{
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
}
// Label: 13px, 600, #D1D1D6
// Required: #FF3B30
// Optional: #8E8E93, 400
```

**Language Sections (Collapsible):**
```typescript
// Accordion Container
{
    background: 'rgba(255,255,255,0.04)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
    overflow: 'hidden',
}

// Header (button)
{
    width: '100%',
    padding: '16px',
    background: 'transparent',
    border: 'none',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'left',
}

// Content
{
    padding: '0 16px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
}
```

**Footer:**
```typescript
{
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '24px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
}
```

### Import Modal

**Similar structure to Create/Edit, with:**
- Template download section
- Drag & drop file zone (dashed border, rgba(255,255,255,0.2))
- Mode selector (radio buttons)
- Preview table (same styling as main table)
- Validation badges (green for valid, red for invalid)

### Bulk Edit Modal

**Smaller modal:**
- maxWidth: '500px'
- Info box: rgba(0, 122, 255, 0.1) background
- 3 select fields: Level, Difficulty, Frequency

---

## ✅ CONSISTENCY CHECKLIST

### Visual Consistency
- [ ] Same gradient background
- [ ] Same font sizes and weights
- [ ] Same colors (primary, secondary, error)
- [ ] Same border radius (12px/16px/20px)
- [ ] Same padding/margins
- [ ] Same card styling
- [ ] Same button styling
- [ ] Same input/select styling

### Component Consistency
- [ ] Stats dashboard (4 cards + 3 charts)
- [ ] Filters section
- [ ] Table structure (13 columns for vocab-style)
- [ ] Pagination
- [ ] Modal styling
- [ ] Empty states
- [ ] Loading states

### Functional Consistency
- [ ] Create button opens modal
- [ ] Edit button pre-fills modal
- [ ] Delete confirmation
- [ ] Multi-select with checkboxes
- [ ] Bulk operations
- [ ] CSV import/export
- [ ] Search and filters
- [ ] Pagination

---

## 📐 RESPONSIVE BEHAVIOR

- Header buttons wrap on small screens
- Stats grid adapts: `repeat(auto-fit, minmax(200px, 1fr))`
- Filters grid adapts: `repeat(auto-fit, minmax(200px, 1fr))`
- Table scrolls horizontally (minWidth: '1400px')
- Modals scale down with max-width and padding

---

## 🎯 KEY PRINCIPLES

1. **Glassmorphism**: All cards use semi-transparent backgrounds with subtle borders
2. **Consistent spacing**: 12px/16px/20px/24px system
3. **Color coding**: Blue=primary, Green=success, Red=danger, Yellow=warning
4. **Typography hierarchy**: Clear size and weight differences
5. **Interactive feedback**: Hover states, transitions (all 0.2s)
6. **Accessibility**: Proper contrast, labels, tooltips

---

**END OF REFERENCE**
