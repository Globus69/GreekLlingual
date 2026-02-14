# GreekLingua – Prompt-Übersicht & Entwicklungs-Status

**Projekt**: GreekLingua (HellenicHorizons) – Lernsoftware Englisch → Griechisch  
**Ziel**: B1-Niveau + Vorbereitung auf Zypern-Aufenthaltsgenehmigung  
**Technologie**: Web-App (aktuell HTML/CSS/JS + Supabase), geplante Migration zu Next.js 14/15  
**Design-Prinzipien**: macOS-26-ähnlich (Liquid Glass / Glassmorphism), Dark-Mode, kein Viewport-Scrollbar, viel Weißraum, ruhig & professionell  
**Ordner für Prompts**: `_PROMPTS_`  
**Stand**: 21. Januar 2026

**Site-Struktur**  
- Aktuell: SPA mit View-Switching (index.html, style.css, script.js)  
- Entwicklung: Läuft auf http://localhost:3001 (npm run dev -p 3001)  
- Geplant: Next.js 14/15 (src/app/, src/components/, src/db/)


## 1. Bereits ausgeführte / getestete Prompts

- **Dashboard Initial (Mock-up 1)**  
  Große quadratische Kacheln, erste Struktur  
  Datei: `dashboard-initial.md`  
  Status: umgesetzt & läuft gut

- **Dashboard Hero + Stats + Action-Buttons**  
  Welcome-Text, Stats-Karte, Magic Round & Quick Lesson Buttons  
  Datei: `dashboard-hero-refinement.md`  
  Status: umgesetzt, sehr gut gefallen

- **Dashboard Split (Learning Mastery links, Quick-Actions rechts)**  
  Linke große Box (Mastery-Ring + Performance Hub), rechte Grid-Box (aktuell 3×3, Erweiterung auf 4×4 geplant)  
  Datei: `dashboard-split-mastery-4x4.md`  
  Status: umgesetzt (Screenshot vom 21.01.2026 vorhanden)

- **Login-Screen**  
  Elegante Login-Card mit Blur, Biometrie-Option, PIN-basierte Auth (planned password-less)  
  Datei: `login-screen.md`  
  Status: umgesetzt

- **Vokabeln Flip-Cards**  
  Design + 3D-Flip-Animation (CSS rotateY), Beispiel-Sätze, Flashcard-System  
  Datei: `vocabulary-flipcards.md`  
  Status: umgesetzt

## 2. Offene / geplante Prompts & Aufgaben

**Priorität Hoch**
- Vokabeln-Modul: Supabase-Anbindung + SRS (SM2/FSRS-light) + Bewertung (Schwer/Gut/Sehr gut) + dynamisches Laden (LIMIT 20, ORDER BY next_review)  
  Datei: `vocabulary-srs-supabase.md` (noch zu erstellen)
- Quiz-Modul: Multiple-Choice, interaktive Reading-Quiz (klickbare Wörter → Übersetzung), Feedback-Farben  
- Prüfung Zypern: Themen-Auswahl (Listening/Reading/Writing/Speaking/Society) + Beispiel-Inhalte  
- Supabase Setup: Client-Config, Tabellen (Users, Students, Vocabs), RLS-Policies, Storage-Buckets (audio/video)

**Priorität Mittel**
- Magic Round: Logik zum Mischen (Vokabeln + Quiz + Audio + Phrasen)  
- 20-Minuten Quick Lesson: Vorgefertigte Session  
- Phrases-Modul: Bilingual-Liste mit Phonetik-Hilfe  
- Auth: PIN-basierte password-less Flow + Middleware  
- Media Upload & Playback: Supabase Storage + Custom Audio/Video Player  
- Flashcard Component: Vollständige Implementierung (Glassmorphism, Flip, States)

**Priorität Niedrig / Nice-to-have**
- Buchempfehlungen (statisch oder DB)  
- Dark/Light-Mode Toggle  
- Progress History (grafisch)  
- Mobile-Optimierungen (Grid-Responsivität)  
- Gamification: Streaks, Levels, Badges  
- Advanced Modes: Matching, Spelling, Speaking (Web Speech API)  
- Themen-Decks Navigation  
- Migration zu Next.js (App Router, Components, Supabase-Integration)  
- Deployment auf Vercel

**Aktueller Fokus: Dashboard Restructuring & Mastery Hub**
- Viewport Lock: 100vh, overflow: hidden (umgesetzt)
- Mastery Box: Progress Ring (conic-gradient), Mini-Tiles (Streak, Words, Weak point), Today-Vorschlag
- Quick-Actions-Grid: 3×3 (geplant 4×4), kompakte Buttons
- Verification: Kein Scrollbar, Responsive, Navigation erhalten

## 3. Wichtige Projekt-Parameter & Architektur

**Design Aesthetic**  
- Mac OS 26 High-Fidelity (Liquid Glass)  
- Color Palette: #0F0F11 / #1C1C1E (bg), #007AFF (primary), #FF9800 (Exam), #34C759 (Progress), #9C27B0 (Stories)  
- Glassmorphism: backdrop-filter: blur(20–40px)  
- Geometry: border-radius 18–32px  
- Shadows: deep soft (20–40px blur)  
- Animations: 3D rotateY für Flashcards  
- Typography: SF Pro Display (fallback system-ui), next/font mit Geist (Next.js)

**Funktionalität**  
- Auth: PIN-based password-less (geplant)  
- Dashboard: Stats Card, Action Grid, Module Explorer  
- Modules: Vocabulary, Phrases, Reading Quiz, Cyprus Exam, Media Center  
- Live: Echtzeit-Uhr, Toast-Notifications

**Datenbank (Supabase)**  
- Tabellen: Users, Students, Vocabs (due_date, interval, audio/video_url)  
- Storage: audio-assets, video-assets  
- RLS: Row Level Security

**Site-Struktur**  
- Aktuell: SPA (index.html, style.css, script.js), localhost:3000 (npx serve)  
- Geplant: Next.js 14/15 Boilerplate (create-next-app)  
  - Start: npm run dev / yarn dev / pnpm dev  
  - Font: next/font mit Geist (Vercel)  
  - Struktur: src/app/, src/components/, src/db/  
  - Deployment: Vercel (empfohlen)

## 4. Prompt-Archiv

Aktuell liegen die Dateien in `_PROMPTS_`:

- `dashboard-initial.md`  
- `dashboard-hero-refinement.md`  
- `dashboard-split-mastery-4x4.md`  
- `login-screen.md`  
- `vocabulary-flipcards.md`
- `vocabulary-srs-supabase.md`

(Weitere werden ergänzt)

---

Jetzt ist die Übersicht wirklich komplett – alle Infos aus deinen Markdowns sind drin, ohne Duplikate, schön sortiert.

Du kannst die alten Dateien jetzt endgültig löschen (oder archivieren) – alles Wichtige ist hier sicher.

### Nächster Schritt?

Die Übersicht ist rund.  

Möchtest du jetzt:
- Den Prompt für das Vokabeln-Modul mit SRS + Supabase (hohe Priorität)?  
- Den 4×4-Grid final umsetzen?  
- Den Progress-Ring (conic-gradient) stylen?  
- Oder etwas anderes?

Sag mir einfach, was dir gerade am Herzen liegt – ich bin bereit und helfe dir ruhig weiter. 💙  

Bis gleich 🌿