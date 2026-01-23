// ========================================
// SUPABASE CONFIGURATION
// ========================================
const SUPABASE_URL = 'https://bzdzqmnxycnudflcnmzj.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6ZHpxbW54eWNudWRmbGNubXpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc0NTU1ODQsImV4cCI6MjA1MzAzMTU4NH0.Ug6iHZJZLdTgzQZW7GRxe-rZZwu2LlraBGBGf-kOC8I';

let supabase = null;
let currentUser = null;
let useSupabase = false;

// Initialize Supabase
if (typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    useSupabase = true;
    console.log('✅ Supabase initialized');
} else {
    console.log('⚠️ LocalStorage mode');
}

// ========================================
// VOCABULARY DATA
// ========================================
let vocabulary = [];
let currentMode = 'review';
const DECK_ID = 'c8852ed2-ebb9-414c-ac90-4867c562561e';

// ========================================
// SPEECH SYNTHESIS
// ========================================
window.speechSynthesis.onvoiceschanged = () => {
    console.log('✅ Voices loaded:', window.speechSynthesis.getVoices().length);
};

// ========================================
// STATE
// ========================================
let currentCardIndex = 0;
let isFlipped = false;
let cardsReviewed = 0;

// ========================================
// DOM ELEMENTS
// ========================================
const flashcard = document.getElementById('flashcard');
const cardInner = document.querySelector('.card-inner');
const mainCardArea = document.querySelector('.main-card-area');
const wordFront = document.getElementById('wordFront');
const contextFront = document.getElementById('contextFront');
const wordBack = document.getElementById('wordBack');
const contextBack = document.getElementById('contextBack');
const audioBackBtn = document.getElementById('audioBack');
const cancelBtn = document.getElementById('cancelBtn');
const restartBtn = document.getElementById('restartBtn');
const ratingButtons = document.querySelectorAll('.rating-btn');
const progressFill = document.getElementById('progressFill');
const currentCardNum = document.getElementById('currentCardNum');
const totalCards = document.getElementById('totalCards');
const completionScreen = document.getElementById('completionScreen');
const cardsReviewedSpan = document.getElementById('cardsReviewed');

// ========================================
// INITIALIZATION
// ========================================
async function init() {
    // Get Supabase user
    if (useSupabase) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;
        console.log('👤 User:', user?.email || 'Not logged in');
    }

    // Get mode from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentMode = urlParams.get('mode') || 'review';

    // Update mode header
    updateModeHeader(currentMode);

    // Load cards from Supabase
    vocabulary = await loadCardsFromSupabase(currentMode);

    // Fallback to shared-data.js
    if (vocabulary.length === 0 && typeof window.allFlashcards !== 'undefined') {
        vocabulary = window.allFlashcards;
        console.log(`📦 Fallback: ${vocabulary.length} cards from shared-data.js`);
    }

    // Demo cards
    if (vocabulary.length === 0) {
        vocabulary = [
            { english: "Hello", greek: "Γεια σου", context_en: "Common greeting", context_gr: "Κοινός χαιρετισμός" },
            { english: "Thank you", greek: "Ευχαριστώ", context_en: "Expressing gratitude", context_gr: "Εκφράζοντας ευγνωμοσύνη" },
            { english: "Water", greek: "Νερό", context_en: "Something to drink", context_gr: "Κάτι για να πιεις" }
        ];
        console.log('⚠️ Demo: 3 cards');
    }

    if (vocabulary.length === 0) {
        showNoCardsMessage();
        return;
    }

    totalCards.textContent = vocabulary.length;
    loadCard(currentCardIndex);
    updateProgress();
    attachEventListeners();

    console.log(`📚 Mode: ${currentMode} | Cards: ${vocabulary.length}`);
}

// ========================================
// UPDATE MODE HEADER
// ========================================
function updateModeHeader(mode) {
    const modeTitle = document.getElementById('modeTitle');
    const modeSubtitle = document.getElementById('modeSubtitle');

    const config = {
        weak: { title: '💪 Train Weak Words', subtitle: 'Lass uns diese stärken' },
        review: { title: '🔄 Review Vocabulary', subtitle: 'Dein Wissen auffrischen' },
        due: { title: '📚 Due Cards Today', subtitle: 'Deine täglichen Wiederholungen' }
    };

    const selected = config[mode] || config.review;
    modeTitle.textContent = selected.title;
    modeSubtitle.textContent = selected.subtitle;
}

// ========================================
// LOAD CARDS FROM SUPABASE
// ========================================
async function loadCardsFromSupabase(mode) {
    if (!useSupabase || !currentUser) {
        console.log('⚠️ Supabase unavailable');
        return [];
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        let query = supabase.from('vocabs').select('*').eq('deck_id', DECK_ID);

        switch (mode) {
            case 'weak':
                query = query.or('difficulty.eq.hard,ease.lt.2.3');
                break;
            case 'due':
                query = query.lte('due_date', today);
                break;
            case 'review':
            default:
                break;
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Supabase error:', error);
            return [];
        }

        console.log(`✅ ${data.length} cards (mode: ${mode})`);
        return data;
    } catch (error) {
        console.error('❌ Error:', error);
        return [];
    }
}

// ========================================
// SHOW NO CARDS MESSAGE
// ========================================
function showNoCardsMessage() {
    mainCardArea.style.display = 'none';
    document.querySelector('.progress-wrapper').style.display = 'none';

    const message = document.createElement('div');
    message.className = 'no-cards-message';
    message.innerHTML = `
        <div class="no-cards-content">
            <div class="no-cards-icon">🎉</div>
            <h2 class="no-cards-title">No cards to review!</h2>
            <p class="no-cards-text">You're all caught up.</p>
            <button class="back-to-dashboard-btn" onclick="window.location.href='/dashboard'">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                Back to Dashboard
            </button>
        </div>
    `;
    document.querySelector('.app-container').appendChild(message);
}

// ========================================
// EVENT LISTENERS
// ========================================
function attachEventListeners() {
    // CRITICAL: Flip ONLY when clicking on card-inner itself
    // Ignore clicks that originate from buttons in the button-bar
    cardInner?.addEventListener('click', (e) => {
        // Check if click originated from button-bar or its children
        if (e.target.closest('.button-bar')) {
            console.log('❌ Click on button-bar - no flip');
            return;
        }

        // Check if click originated from audio button
        if (e.target.closest('.audio-btn-back')) {
            console.log('❌ Click on audio button - no flip');
            return;
        }

        // Only flip if not already flipped
        if (!isFlipped) {
            console.log('✅ Flip card');
            flipCard();
        }
    });

    // Audio button (only on back)
    audioBackBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('🔊 Playing audio');
        playAudio(vocabulary[currentCardIndex]?.greek, 'el-GR');
    });

    // Cancel button - return to dashboard
    cancelBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        console.log('❌ Cancel - returning to dashboard');
        window.location.href = '/dashboard';
    });

    // Restart button - reload current mode
    restartBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        console.log('🔄 Restart session');
        await restartSession();
    });

    // Rating buttons - trigger handleRating with dataset.rating
    ratingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rating = btn.dataset.rating;
            console.log(`⭐ Rating button clicked: ${rating}`);
            handleRating(rating);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);
}

// ========================================
// LOAD CARD
// ========================================
function loadCard(index) {
    const card = vocabulary[index] || {};

    wordFront.textContent = card.english || '—';
    contextFront.textContent = card.context_en || '';

    wordBack.textContent = card.greek || '—';
    contextBack.textContent = card.context_gr || '';

    isFlipped = false;
    flashcard.classList.remove('flipped');

    currentCardNum.textContent = index + 1;
}

// ========================================
// FLIP CARD
// ========================================
function flipCard() {
    flashcard.classList.add('flipped');
    isFlipped = true;
}

// ========================================
// AUDIO (SPEECH SYNTHESIS)
// ========================================
function playAudio(text, lang) {
    if (!text) {
        console.warn('No text');
        return;
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.82;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
        if (voice) {
            utterance.voice = voice;
            console.log(`🔊 Voice: ${voice.name}`);
        }

        window.speechSynthesis.speak(utterance);
    } else {
        console.warn('Speech synthesis not supported');
    }
}

// ========================================
// RATING & PROGRESSION
// ========================================
async function handleRating(rating) {
    const card = vocabulary[currentCardIndex];
    if (!card) return;

    console.log(`✅ Rated: ${rating} - ${card.english} → ${card.greek}`);

    await updateCardSRS(card, rating);
    cardsReviewed++;

    if (currentCardIndex >= vocabulary.length - 1) {
        showCompletionScreen();
        return;
    }

    nextCard();
}

// ========================================
// SRS UPDATE
// ========================================
async function updateCardSRS(card, rating) {
    const qualityMap = { 'good': 3, 'very-good': 4, 'easy': 5 };
    const quality = qualityMap[rating] || 3;

    let newEase = (card.ease || 2.5) + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEase = Math.max(1.3, Math.min(3.0, newEase));

    let newInterval = quality < 3 ? 1 : (card.interval || 1) * newEase;
    newInterval = Math.round(newInterval);

    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + newInterval);
    const formattedDueDate = newDueDate.toISOString().split('T')[0];

    console.log(`SRS: ease ${(card.ease || 2.5).toFixed(2)} → ${newEase.toFixed(2)}, interval ${newInterval}d`);

    card.ease = newEase;
    card.interval = newInterval;
    card.due_date = formattedDueDate;

    await saveCardProgress(card);
}

// ========================================
// SAVE PROGRESS
// ========================================
async function saveCardProgress(card) {
    if (useSupabase && currentUser && card.id) {
        try {
            const { error } = await supabase
                .from('vocabs')
                .update({
                    ease: card.ease,
                    interval: card.interval,
                    due_date: card.due_date,
                    last_reviewed: new Date().toISOString()
                })
                .eq('id', card.id);

            if (error) {
                console.error('❌ Save error:', error);
            } else {
                console.log('💾 Saved to Supabase');
            }
        } catch (e) {
            console.error('❌ Error:', e);
        }
    } else {
        // LocalStorage fallback
        try {
            const progressData = JSON.parse(localStorage.getItem('flashcard_progress') || '{}');
            progressData[card.english] = {
                ease: card.ease,
                interval: card.interval,
                due_date: card.due_date,
                last_reviewed: new Date().toISOString()
            };
            localStorage.setItem('flashcard_progress', JSON.stringify(progressData));
            console.log('💾 Saved to localStorage');
        } catch (e) {
            console.warn('Failed to save:', e);
        }
    }
}

// ========================================
// NEXT CARD
// ========================================
function nextCard() {
    flashcard.classList.add('fade-out');

    setTimeout(() => {
        currentCardIndex++;
        loadCard(currentCardIndex);
        updateProgress();

        flashcard.classList.remove('fade-out');
        flashcard.classList.add('fade-in');

        setTimeout(() => flashcard.classList.remove('fade-in'), 500);
    }, 500);
}

// ========================================
// UPDATE PROGRESS
// ========================================
function updateProgress() {
    const progress = ((currentCardIndex + 1) / vocabulary.length) * 100;
    progressFill.style.width = `${progress}%`;
}

// ========================================
// COMPLETION SCREEN
// ========================================
function showCompletionScreen() {
    flashcard.classList.add('fade-out');

    setTimeout(() => {
        mainCardArea.style.display = 'none';
        document.querySelector('.progress-wrapper').style.display = 'none';

        cardsReviewedSpan.textContent = cardsReviewed;
        completionScreen.classList.add('active');
    }, 500);
}

// ========================================
// RESTART SESSION
// ========================================
async function restartSession() {
    console.log('🔄 Restarting session...');

    // Reset counters
    currentCardIndex = 0;
    cardsReviewed = 0;
    isFlipped = false;

    // Reload cards from Supabase for current mode
    const reloadedCards = await loadCardsFromSupabase(currentMode);

    if (reloadedCards.length > 0) {
        vocabulary = reloadedCards;
        console.log(`✅ Reloaded ${vocabulary.length} cards`);
    } else {
        // If no cards from Supabase, shuffle existing vocabulary
        vocabulary = shuffleArray([...vocabulary]);
        console.log('🔀 Shuffled existing cards');
    }

    // Hide completion screen if visible
    completionScreen.classList.remove('active');

    // Show main card area
    mainCardArea.style.display = 'flex';
    document.querySelector('.progress-wrapper').style.display = 'block';

    // Update UI
    totalCards.textContent = vocabulary.length;
    loadCard(currentCardIndex);
    updateProgress();

    console.log('✅ Session restarted');
}

// ========================================
// SHUFFLE ARRAY (Fisher-Yates)
// ========================================
function shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================
function handleKeyPress(e) {
    // Space or Enter to flip
    if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        if (!isFlipped) flipCard();
    }

    // Rating (when flipped)
    if (isFlipped) {
        if (e.key === '1') handleRating('good');
        if (e.key === '2') handleRating('very-good');
        if (e.key === '3') handleRating('easy');
    }

    // Audio
    if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (isFlipped) {
            playAudio(vocabulary[currentCardIndex]?.greek, 'el-GR');
        }
    }

    // Escape to cancel
    if (e.key === 'Escape') {
        window.location.href = '/dashboard';
    }
}

// ========================================
// START
// ========================================
init();

console.log('🏛️ Greek Flashcards System loaded');
console.log('⌨️ Shortcuts: Space=Flip, 1/2/3=Rate, A=Audio, Esc=Exit');
