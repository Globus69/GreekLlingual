// ========================================
// SHORT STORIES – Supabase & Audio (MP3)
// ========================================
const SUPABASE_URL = 'https://bzdzqmnxycnudflcnmzj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uT0wv5-tv95ETP0u16h8zg_Ni3WqAIo';

let supabaseClient = null;
let currentUser = null;
let useSupabase = false;
let audioEl = null;

function initializeSupabase() {
    try {
        let SupabaseLibrary = null;
        if (typeof window.supabase !== 'undefined') {
            if (window.supabase.createClient) SupabaseLibrary = window.supabase;
            else if (window.supabase.default?.createClient) SupabaseLibrary = window.supabase.default;
        }
        if (!SupabaseLibrary && typeof supabase !== 'undefined') {
            if (supabase.createClient) SupabaseLibrary = supabase;
            else if (supabase.default?.createClient) SupabaseLibrary = supabase.default;
        }
        if (SupabaseLibrary?.createClient) {
            supabaseClient = SupabaseLibrary.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            useSupabase = true;
            return true;
        }
        return false;
    } catch (err) {
        console.error('Supabase init error:', err);
        return false;
    }
}

window.addEventListener('supabase-loaded', () => { if (!useSupabase) initializeSupabase(); });

let initAttempts = 0;
function tryInitSupabase() {
    initAttempts++;
    if (initializeSupabase()) return true;
    if (initAttempts < 10) setTimeout(tryInitSupabase, 200);
    return false;
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryInitSupabase, 100));
} else {
    setTimeout(tryInitSupabase, 100);
}

// ========================================
// DATA
// ========================================
let stories = [];
let currentIndex = 0;
let storiesReviewed = 0;

const FALLBACK_STORIES = [
    { id: 'f1', greek_text: 'Καλημέρα! Ονομάζομαι Μαρία.', english_text: 'Good morning! My name is Maria.', audio_url: null },
    { id: 'f2', greek_text: 'Πώς σε λένε; Είμαι από την Ελλάδα.\n\nΠού μένεις; Εγώ μένω στην Αθήνα.\n\nΤι ώρα είναι; Θέλω να πάω στο καφενείο.', english_text: 'What is your name? I am from Greece.\n\nWhere do you live? I live in Athens.\n\nWhat time is it? I want to go to the café.', audio_url: null },
    { id: 'f3', greek_text: 'Πού μένεις; Εγώ μένω στην Αθήνα.', english_text: 'Where do you live? I live in Athens.', audio_url: null },
];

// ========================================
// DOM
// ========================================
const phraseCard = document.getElementById('phraseCard');
const greekScrollContainer = document.getElementById('greekScrollContainer');
const englishScrollContainer = document.getElementById('englishScrollContainer');
const audioBtn = document.getElementById('audioBtn');
const cancelBtn = document.getElementById('cancelBtn');
const restartBtn = document.getElementById('restartBtn');
const ratingButtons = document.querySelectorAll('.rating-btn');
const progressFill = document.getElementById('progressFill');
const currentCardNum = document.getElementById('currentCardNum');
const totalCards = document.getElementById('totalCards');
const completionScreen = document.getElementById('completionScreen');
const phrasesReviewedSpan = document.getElementById('phrasesReviewed');
const mainCardArea = document.querySelector('.main-card-area');

let currentSectionIndex = 0;
let sectionCount = 1;
let greekSectionEls = [];
let englishSectionEls = [];

// ========================================
// LOAD FROM SUPABASE
// ========================================
async function loadStoriesFromSupabase() {
    if (!useSupabase || !supabaseClient) {
        await new Promise(r => setTimeout(r, 300));
        if (!useSupabase || !supabaseClient) {
            console.log('Using fallback Short Stories');
            return shuffle([...FALLBACK_STORIES]);
        }
    }

    try {
        const { data, error } = await supabaseClient
            .from('short_stories')
            .select('id, greek_text, english_text, audio_url, title')
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) {
            if (error.message?.includes('does not exist') || error.code === '42P01') {
                console.warn('short_stories table missing. Run supabase/insert_test_short_stories.sql');
            }
            return shuffle([...FALLBACK_STORIES]);
        }
        if (!data?.length) return shuffle([...FALLBACK_STORIES]);
        return shuffle(data);
    } catch (e) {
        console.warn('Short Stories fetch error:', e);
        return shuffle([...FALLBACK_STORIES]);
    }
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ========================================
// INIT
// ========================================
async function init() {
    if (!useSupabase) {
        await new Promise(r => setTimeout(r, 500));
        initializeSupabase();
        await new Promise(r => setTimeout(r, 300));
    }

    if (useSupabase && supabaseClient) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            currentUser = user || null;
        } catch (_) {
            currentUser = null;
        }
    }

    attachListeners();

    stories = await loadStoriesFromSupabase();
    if (stories.length === 0) {
        showNoStories();
        return;
    }

    totalCards.textContent = stories.length;
    loadStory(currentIndex);
    updateProgress();
}

function showNoStories() {
    if (mainCardArea) mainCardArea.style.display = 'none';
    const pw = document.querySelector('.progress-wrapper');
    if (pw) pw.style.display = 'none';
    const el = document.createElement('div');
    el.className = 'completion-screen active';
    el.innerHTML = `
        <div class="completion-content">
            <div class="completion-icon">📚</div>
            <h2 class="completion-title">Keine Short Stories</h2>
            <p class="completion-text">Führe supabase/insert_test_short_stories.sql aus.</p>
            <button class="back-to-dashboard-btn" id="noStoriesBack">Back to Dashboard</button>
        </div>
    `;
    document.querySelector('.app-container').appendChild(el);
    document.getElementById('noStoriesBack').addEventListener('click', () => { window.location.href = '/dashboard'; });
}

// ========================================
// SECTIONS (Abschnitte: \n\n or \n)
// ========================================
function splitSections(text) {
    if (!text || !String(text).trim()) return ['—'];
    const s = String(text).trim();
    let parts = s.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) parts = s.split(/\n/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) return [s];
    return parts;
}

function buildSectionDom(container, sections, className) {
    container.innerHTML = '';
    const els = [];
    sections.forEach((txt) => {
        const div = document.createElement('div');
        div.className = className || 'frame-section';
        div.textContent = txt;
        container.appendChild(div);
        els.push(div);
    });
    return els;
}

// ========================================
// LOAD STORY (upper: Greek, lower: English), section scroll
// ========================================
function loadStory(index) {
    const s = stories[index] || {};
    const greekRaw = s.greek_text || '—';
    const englishRaw = s.english_text || '—';
    const greekParts = splitSections(greekRaw);
    const englishParts = splitSections(englishRaw);
    sectionCount = Math.max(greekParts.length, englishParts.length, 1);

    const greekSections = [];
    const englishSections = [];
    for (let i = 0; i < sectionCount; i++) {
        greekSections.push(greekParts[i] ?? '');
        englishSections.push(englishParts[i] ?? '');
    }

    greekSectionEls = buildSectionDom(greekScrollContainer, greekSections, 'frame-section');
    englishSectionEls = buildSectionDom(englishScrollContainer, englishSections, 'frame-section');

    currentSectionIndex = 0;
    currentCardNum.textContent = index + 1;

    const en = document.querySelector('.english-translation-container');
    if (en) en.classList.add('blurred');

    scrollToSection(0);
}

function scrollToSection(i) {
    currentSectionIndex = Math.max(0, Math.min(i, sectionCount - 1));
    const scrollOne = (container, els) => {
        if (!container || !els[currentSectionIndex]) return;
        const el = els[currentSectionIndex];
        const rect = el.getBoundingClientRect();
        const contRect = container.getBoundingClientRect();
        const relTop = rect.top - contRect.top + container.scrollTop;
        const top = Math.max(0, Math.round(relTop) - 8);
        container.scrollTo({ top, behavior: 'smooth' });
    };
    scrollOne(greekScrollContainer, greekSectionEls);
    scrollOne(englishScrollContainer, englishSectionEls);
    updateArrowDisabled();
}

function updateArrowDisabled() {
    const up = document.querySelectorAll('.scroll-arrow.scroll-up');
    const down = document.querySelectorAll('.scroll-arrow.scroll-down');
    up.forEach((btn) => { btn.disabled = sectionCount <= 1 || currentSectionIndex <= 0; });
    down.forEach((btn) => { btn.disabled = sectionCount <= 1 || currentSectionIndex >= sectionCount - 1; });
}

function scrollSectionUp() {
    if (currentSectionIndex <= 0) return;
    scrollToSection(currentSectionIndex - 1);
}

function scrollSectionDown() {
    if (currentSectionIndex >= sectionCount - 1) return;
    scrollToSection(currentSectionIndex + 1);
}

// ========================================
// AUDIO: MP3 from audio_url, fallback TTS
// ========================================
function playAudio() {
    const s = stories[currentIndex];
    if (!s) return;

    const url = (s.audio_url || '').trim();
    if (url) {
        if (!audioEl) {
            audioEl = new Audio();
            audioEl.addEventListener('error', () => {
                console.warn('MP3 failed, using TTS');
                ttsFallback(s.greek_text);
            });
        }
        audioEl.src = url.startsWith('http') || url.startsWith('/') ? url : '/' + url.replace(/^\//, '');
        audioEl.play().catch(() => ttsFallback(s.greek_text));
        return;
    }

    ttsFallback(s.greek_text);
}

function ttsFallback(text) {
    if (!text) return;
    const clean = text.replace(/\n/g, ' ');
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'el-GR';
    u.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(x => x.lang === 'el-GR' || x.lang.startsWith('el'));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
}

// ========================================
// RATING & PROGRESSION (pro Abschnitt)
// ========================================
async function saveSectionRating(storyId, sectionIndex, rating) {
    if (!useSupabase || !supabaseClient || !currentUser?.id) return;
    const uid = currentUser.id;
    if (!uid || typeof storyId !== 'string' || storyId.length < 30) return;
    try {
        await supabaseClient
            .from('short_story_section_ratings')
            .upsert(
                { student_id: uid, story_id: storyId, section_index: sectionIndex, rating },
                { onConflict: ['student_id', 'story_id', 'section_index'] }
            );
    } catch (e) {
        console.warn('Could not save section rating:', e);
    }
}

async function handleRating(rating) {
    const s = stories[currentIndex];
    if (!s) return;
    await saveSectionRating(s.id, currentSectionIndex, rating);
    storiesReviewed++;

    if (currentSectionIndex < sectionCount - 1) {
        scrollToSection(currentSectionIndex + 1);
        return;
    }
    if (currentIndex >= stories.length - 1) {
        showCompletion();
        return;
    }
    nextStory();
}

function nextStory() {
    phraseCard.classList.add('fade-out');
    setTimeout(() => {
        currentIndex++;
        loadStory(currentIndex);
        updateProgress();
        phraseCard.classList.remove('fade-out');
        phraseCard.classList.add('fade-in');
        setTimeout(() => phraseCard.classList.remove('fade-in'), 500);
    }, 500);
}

function updateProgress() {
    const pct = stories.length ? ((currentIndex + 1) / stories.length) * 100 : 0;
    progressFill.style.width = `${pct}%`;
}

function showCompletion() {
    phraseCard.classList.add('fade-out');
    setTimeout(() => {
        mainCardArea.style.display = 'none';
        const pw = document.querySelector('.progress-wrapper');
        if (pw) pw.style.display = 'none';
        phrasesReviewedSpan.textContent = storiesReviewed;
        completionScreen.classList.add('active');
    }, 500);
}

async function restartSession() {
    currentIndex = 0;
    storiesReviewed = 0;
    stories = await loadStoriesFromSupabase();
    if (stories.length === 0) {
        showNoStories();
        return;
    }
    completionScreen.classList.remove('active');
    mainCardArea.style.display = 'flex';
    const pw = document.querySelector('.progress-wrapper');
    if (pw) pw.style.display = 'block';
    totalCards.textContent = stories.length;
    loadStory(currentIndex);
    updateProgress();
}

// ========================================
// EVENT LISTENERS
// ========================================
function attachListeners() {
    audioBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        playAudio();
    });

    cancelBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = '/dashboard';
    });

    restartBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        restartSession();
    });

    ratingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const r = btn.dataset.rating;
            if (r) handleRating(r);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === '1') handleRating('hard');
        if (e.key === '2') handleRating('good');
        if (e.key === '3') handleRating('easy');
        if (e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            playAudio();
        }
        if (e.key === 'ArrowUp') { e.preventDefault(); scrollSectionUp(); }
        if (e.key === 'ArrowDown') { e.preventDefault(); scrollSectionDown(); }
        if (e.key === 'Escape') window.location.href = '/dashboard';
    });

    const enContainer = document.querySelector('.english-translation-container');
    if (enContainer) {
        enContainer.addEventListener('click', function() {
            this.classList.remove('blurred');
        });
    }

    document.querySelectorAll('.scroll-arrow.scroll-up').forEach((btn) => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); scrollSectionUp(); });
    });
    document.querySelectorAll('.scroll-arrow.scroll-down').forEach((btn) => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); scrollSectionDown(); });
    });

    const backBtn = document.getElementById('backToDashboardBtn');
    if (backBtn) backBtn.addEventListener('click', () => { window.location.href = '/dashboard'; });
}

// ========================================
// START
// ========================================
function start() {
    if (!useSupabase) {
        setTimeout(() => {
            initializeSupabase();
            init();
        }, 500);
        return;
    }
    init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(start, 300));
} else {
    setTimeout(start, 300);
}
