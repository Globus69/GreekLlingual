# GreekLingua Project Status Report: January 21, 2026

This document provides a technical analysis of the project's source code, reflecting the *actual implemented state* across the Web, Desktop (Python), and Next.js infrastructures.

---

## 1. Layout & Visual Design (macOS 26 "Liquid Glass")

The project implements a premium, high-fidelity design language inspired by future macOS aesthetics.

### **UI Philosophy**
*   **Theme**: Strict Dark Mode (`#0F0F11` background, `#1C1C1E` cards).
*   **Surface Logic**: Extensive use of **Glassmorphism** (`backdrop-filter: blur(20px to 40px)`).
*   **Geometry**: Large corner radii (18px for buttons, 24px-32px for cards/tiles).
*   **Animations**: 
    *   3D CSS `rotateY` transitions for flashcards.
    *   `fadeInUp` and `opacity` transitions for view switching.
    *   Dynamic hover scaling (1.02x - 1.05x) and glow effects.

### **Core Frames (Web Dashboard)**
*   **Frame 1: Sticky Header**: Compact (70px), containing Brand logo (🏛️), live DateTime display (SF Mono font), and User Profile pill (SWS).
*   **Frame 2: Stats-Card**: Left-aligned hero card showing Level (B1), Streak (5 Days), Vocabs (187), and Time Learned (14.5h).
*   **Frame 3: Action-Grid**: 3x3 grid of primary task buttons (Magic Round, Exam Test, Quick Lesson, etc.).
*   **Frame 4: Module-Grid**: Responsive grid (`auto-fit`) containing module tiles (Vokabeln, Phrasen, Quiz, etc.).

---

## 2. Functionality & Active Modules

The project is currently a functional Single Page Application (SPA) with the following implemented modules:

### **Learning Modules**
*   **Vokabeln (Vocabulary)**: 
    *   Traditional flashcard system with 3D flip.
    *   Separates English (Front) and Greek (Back).
    *   Includes example sentences and progress tracking (e.g., "1 / 3").
*   **Phrases**: Bilingual list rendering English phrases with their Greek translations/phonetics.
*   **Reading Quiz**: 
    *   Interactive Greek text display.
    *   Nouns are underlined; clicking them triggers a semantic popup/alert showing the English meaning.
*   **Cyprus Exam Prep**: 
    *   Specialized module for Cypriot dialect and residency requirements.
    *   Implemented via a sub-navigation system (Listening, Reading, Writing sub-views).

### **System Features**
*   **Login Flow**: A simulated 1-second login overlay with "Logging in..." animation.
*   **Live Clock**: Real-time updating clock in the header (HH:mm:ss format).
*   **Navigation Logic**: Javascript-based view management (`openView`/`showToast`) that handles transitions between Dashboard and Module views.
*   **Notifications**: Integrated Toast system (🚀) for feature feedback and placeholders.

---

## 3. Site & File Architecture

The project exists as a hybrid codebase, transitioning from a Python desktop app to a full-stack Next.js web app.

### **Directory Structure**
*   `web/`: The current active development environment (Live SPA).
    *   `index.html`: Contains the entire structure and inline Javascript logic.
    *   `style.css`: 900+ lines of vanilla CSS defining the macOS 26 design system.
    *   `script.js`: (Secondary/Legacy) Contains backup logic and data definitions.
*   `src/`: The Next.js 14+ / TypeScript repository.
    *   `app/`: Dynamic routing structure defined for `student-mockup`.
    *   `components/`: Placeholder for reusable React components.
    *   `db/`: Contains the active Supabase client configuration.
*   `app.py`: Full-featured parallel Desktop application built with **PyQt6**, mirroring the web's design and functionality.

---

## 4. Database & Backend Integration

The backend is currently in an integration/setup phase focusing on **Supabase**.

*   **Client**: `createClient` initialized in `src/db/supabase.ts`.
*   **Environment**: Uses `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
*   **Implemented Data (Mock)**:
    *   Vocabulary, Phrases, and Video metadata are currently managed as static JSON objects within `script.js` to ensure zero-latency performance during the UI transition phase.

---

## 5. Technical Environment Details

*   **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+).
*   **Frameworks**: Next.js 16.1 (Emerging), PyQt6 (Legacy/Desktop).
*   **Development Server**: 
    *   Static: `npx serve web -l 3000` (Currently running).
    *   Next.js: `npm run dev`.
*   **Version Control**: Managed via Git; repository hosted at `https://github.com/Globus69/GreekLlingual.git`.
*   **Dependencies**: React 19.2, TypeScript 5, Supabase JS Client.
