# Project Parameters: HellenicHorizons GreekLingua Dashboard

## 1. Layout & Design System
*   **Design Aesthetic**: "Mac OS 26" High-Fidelity Style (Liquid Glass).
*   **Visual Philosophy**: Premium, dark-mode focused, minimalistic yet functional.
*   **Color Palette**:
    *   **Main Background**: Deep Black/Grey (`#0F0F11`, `#1C1C1E`).
    *   **Primary Accent**: Apple System Blue (`#007AFF`).
    *   **Secondary Accents**: Orange (`#FF9800`) for Exam/Test, Green (`#34C759`) for Progress, Purple (`#9C27B0`) for Stories.
    *   **Text Hierarchy**: `#EDEDED` (Primary), `#8E8E93` (Secondary/Labels).
*   **Key UI Components**:
    *   **Glassmorphism**: Extensive use of `backdrop-filter: blur(40px)` with low-opacity card backgrounds.
    *   **Geometry**: Large border radii (18px to 32px) for cards and buttons.
    *   **Shadows**: Deep, soft shadows for depth and 3D effects.
    *   **Animations**: 3D CSS `rotateY` for flashcards, smooth opacity transitions for view switching.

## 2. Functionality & Features
*   **Authentication**:
    *   Planned PIN-based password-less entry.
    *   Currently implemented as a seamless transition from the Login overlay.
*   **Dashboard (Main Hub)**:
    *   **Stats Card**: Visual tracking of Level (B1), Learning Streak (Days), Vocab count, and total hours.
    *   **Action Grid (Frame 4)**: 3x3 grid for high-impact actions (Magic Round, Exam Test, Quick Lessons, etc.).
    *   **Module Explorer (Frame 5)**: Tile-based navigation to specific learning modules.
*   **Learning Modules**:
    *   **Vocabulary**: traditional Flashcard system with 3D flip functionality and example sentences.
    *   **Phrases**: Bilingual list view (English/Greek) with phonetic helpers.
    *   **Reading Quiz**: Interactive Greek text where clicking underlined words reveals their English meaning.
    *   **Cyprus Exam**: Specialized preparation module for Cypriot dialect and residency exams (Listening/Reading/Writing).
    *   **Media Center**: Integration for Video Lessons, Audio Player, and Library/Books.
*   **Live Features**: Real-time clock/date display and interactive Toast notifications.

## 3. Database Structure (Supabase Integration)
*   **Platform**: Supabase (PostgreSQL) with Row Level Security (RLS).
*   **Tables (Planned Schema)**:
    *   `Users`: `id`, `email`, `pin` (Auth).
    *   `Students`: `id`, `user_id` (FK), `name`, `page_slug` (Dynamic profiles).
    *   `Vocabs`: `id`, `student_id` (FK), `term`, `translation`, `due_date`, `interval` (SM2 Algorithm), `audio_url`, `video_url`.
*   **Storage Buckets**:
    *   `audio-assets`: For vocabulary pronunciations.
    *   `video-assets`: For lesson clips.

## 4. Site Structure
*   **Architecture**: Single Page Application (SPA) utilizing view-switching logic.
*   **File Organization**:
    *   `web/index.html`: Core structure, including all views (Login, Dashboard, Modules).
    *   `web/style.css`: Comprehensive design system and component styling.
    *   `web/script.js`: State management, navigation logic, and mock data.
    *   `src/app/`: Next.js App Router structure (Planned full migration).
    *   `src/components/`: Reusable React components for the Next.js version.
    *   `src/db/`: Database configuration and Supabase clients.

## 5. Other Project Details
*   **Technology Stack**:
    *   **Frontend**: HTML5, CSS3, JavaScript (Vanilla ES6), React (planned migration).
    *   **Backend**: Next.js 14/15, Supabase (BaaS).
    *   **Desktop Legacy**: `app.py` based on Python 3 and PyQt6.
*   **Deployment/Environment**:
    *   **Development**: Runs on `http://localhost:3000` via `npx serve`.
    *   **Dependencies**: managed via `npm`.
*   **Live Updates**: Spaced Repetition (SRT) system is the core upcoming logic enhancement for vocabulary retention.
