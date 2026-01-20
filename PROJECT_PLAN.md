# Project Plan: HellenicHorizons GreekLingua Dashboard

## Overview
A full-stack language learning platform built with Next.js and Supabase, featuring spaced repetition, media integration, and a premium Mac OS 26 aesthetic.

## 1. Setup & Database
- [x] Initialize Next.js project with TypeScript and Vanilla CSS.
- [ ] Install Supabase client library: `npm install @supabase/supabase-js`.
- [ ] Configure Supabase client in `src/db/supabase.ts`.
- [ ] Define database tables in Supabase:
    - `Users`: `id`, `email`, `pin` (password-less entry).
    - `Students`: `id`, `user_id` (FK), `name`, `page_slug` (unique).
    - `Vocabs`: `id`, `student_id` (FK), `term`, `translation`, `due_date`, `interval`, `audio_url`, `video_url`.
- [ ] Setup Storage Buckets: `audio-assets`, `video-assets`.
- [ ] Enable Row Level Security (RLS) policies:
    - Students can only see their own vocabs.
    - Users can only access students linked to their `user_id`.

## 2. Authentication (Register/PIN)
- [ ] custom PIN-based authentication flow.
- [ ] Middleware for session protection.

## 3. Landing Page
- [ ] Welcome screen with App selection/Login.
- [ ] Dashboard for managing "Students" (courses/profiles).

## 4. Student Pages
- [ ] Dynamic routing: `src/app/student/[slug]/page.tsx`.
- [ ] Fetching vocab data based on student `page_slug`.

## 5. Flashcard Component
- [ ] Modern UI with SF Pro font, rounded corners (20px+).
- [ ] Glasmorphism effects (backdrop-filter: blur).
- [ ] States: Question (Term), Answer (Translation).
- [ ] Flip animation using CSS transforms.

## 6. Media Upload & Playback
- [ ] Integration with Supabase Storage for custom audio/video.
- [ ] Custom audio player UI component.

## 7. Scheduling Logic (SRT)
- [ ] Implement Spaced Repetition Algorithm.
- [ ] Logic for calculating `due_date` and `interval` based on user performance (Correct/Incorrect).

## 8. Post-MVP Features (Gamification & Analytics)
- [ ] **Dashboard**: Visual progress graphs (using CSS/SVG) and vocabulary stats.
- [ ] **Gamification**: implement "Streaks", "Levels", and "Badges" system.
- [ ] **Advanced Learning Modes**:
    - "Matching": Drag and drop terms.
    - "Spelling": Type the translation.
    - "Speaking": Voice recording placeholder (integration with Web Speech API).
- [ ] **Theme Navigation**: Organize cards by "Themen-Decks" (Food, Travel, etc.).
- [ ] **AI-Assistance**: Adaptive hints generated based on common mistakes.

## UI Style: Mac OS 26 (Enhanced)
- **Colors**: Vibrant gradients for accents, clean white/dark gray for cards.
- **Glassmorphism**: 15-20% opacity white backgrounds with 20px blur.
- **Typography**: SF Pro Display (fallback to Sans-Serif).
- **Shadows**: Large, soft shadows (20-40px blur, low opacity).
- **Corners**: Large radii (16px to 24px).
- **Animations**: Fluid transitions between different learning modes.

---
*Implementation will proceed step-by-step, starting with the mock-up UI.*
