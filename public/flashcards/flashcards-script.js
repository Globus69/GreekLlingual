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
    console.log('✅ Supabase initialized in flashcards');
} else {
    console.log('⚠️ Using LocalStorage mode (Supabase not configured)');
}

// ========================================
// VOCABULARY DATA
// ========================================
let vocabulary = [];
let currentMode = 'review'; // 'weak', 'review', or 'due'
const DECK_ID = 'c8852ed2-ebb9-414c-ac90-4867c562561e'; // Main Greek deck

// ========================================
// SPEECH SYNTHESIS SETUP
// ========================================
window.speechSynthesis.onvoiceschanged = () => {
    console.log('✅ Voices loaded:', window.speechSynthesis.getVoices().length);
};

// ========================================
// STATE MANAGEMENT
// ========================================
let currentCardIndex = 0;
let isFlipped = false;
let cardsReviewed = 0;

// ========================================
// DOM ELEMENTS
// ========================================
const flashcard = document.getElementById('flashcard');
const cardContainer = document.getElementById('cardContainer');
const wordFront = document.getElementById('wordFront');
const contextFront = document.getElementById('contextFront');
const wordBack = document.getElementById('wordBack');
const contextBack = document.getElementById('contextBack');
const audioFrontBtn = document.getElementById('audioFront');
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
        console.log('👤 Current user:', user?.email || 'Not logged in');
    }

    // Get mode from URL
    const urlParams = new URLSearchParams(window.location.search);
    currentMode = urlParams.get('mode') || 'review';

    // Update mode header
    updateModeHeader(currentMode);

    // Load cards from Supabase based on mode
    vocabulary = await loadCardsFromSupabase(currentMode);

    // Fallback: Load from shared-data.js if no Supabase data
    if (vocabulary.length === 0 && typeof window.allFlashcards !== 'undefined') {
        vocabulary = window.allFlashcards;
        console.log(`📦 Fallback: ${vocabulary.length} cards loaded from shared-data.js`);
    }

    // Final fallback: Demo cards
    if (vocabulary.length === 0) {
        vocabulary = [
            { english: "Hello", greek: "Γεια σου", context_en: "Common greeting", context_gr: "Κοινός χαιρετισμός" },
            { english: "Thank you", greek: "Ευχαριστώ", context_en: "Expressing gratitude", context_gr: "Εκφράζοντας ευγνωμοσύνη" },
            { english: "Water", greek: "Νερό", context_en: "Something to drink", context_gr: "Κάτι για να πιεις" }
        ];
        console.log('⚠️ Demo mode: 3 fallback cards');
    }

    // Check if cards exist
    if (vocabulary.length === 0) {
        showNoCardsMessage();
        return;
    }

    // Set total cards
    totalCards.textContent = vocabulary.length;

    // Load first card
    loadCard(currentCardIndex);
    updateProgress();

    // Attach event listeners
    attachEventListeners();

    console.log(`📚 Mode: ${currentMode} | Cards: ${vocabulary.length}`);
}

// ========================================
// UPDATE MODE HEADER
// ========================================
function updateModeHeader(mode) {
    const modeTitle = document.getElementById('modeTitle');
    const modeSubtitle = document.getElementById('modeSubtitle');

    const modeConfig = {
        weak: {
            title: '💪 Train Weak Words',
            subtitle: 'Lass uns diese stärken'
        },
        review: {
            title: '🔄 Review Vocabulary',
            subtitle: 'Dein Wissen auffrischen'
        },
        due: {
            title: '📚 Due Cards Today',
            subtitle: 'Deine täglichen Wiederholungen'
        }
    };

    const config = modeConfig[mode] || modeConfig.review;
    modeTitle.textContent = config.title;
    modeSubtitle.textContent = config.subtitle;
}

// ========================================
// LOAD CARDS FROM SUPABASE
// ========================================
async function loadCardsFromSupabase(mode) {
    if (!useSupabase || !currentUser) {
        console.log('⚠️ Supabase not available or user not logged in');
        return [];
    }

    try {
        const today = new Date().toISOString().split('T')[0];
        let query = supabase
            .from('vocabs')
            .select('*')
            .eq('deck_id', DECK_ID);

        // Filter based on mode
        switch (mode) {
            case 'weak':
                // Get cards with difficulty='hard' or low ease score
                query = query.or('difficulty.eq.hard,ease.lt.2.3');
                break;

            case 'due':
                // Get cards due today or earlier
                query = query.lte('due_date', today);
                break;

            case 'review':
            default:
                // Get all cards for review
                break;
        }

        const { data, error } = await query.order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Supabase error:', error);
            return [];
        }

        console.log(`✅ Loaded ${data.length} cards from Supabase (mode: ${mode})`);
        return data;
    } catch (error) {
        console.error('❌ Error fetching cards:', error);
        return [];
    }
}

// ========================================
// SHOW NO CARDS MESSAGE
// ========================================
function showNoCardsMessage() {
    cardContainer.style.display = 'none';
    document.querySelector('.progress-wrapper').style.display = 'none';
    document.querySelector('.rating-buttons').style.display = 'none';

    const message = document.createElement('div');
    message.className = 'no-cards-message';
    message.innerHTML = `
        <div class="no-cards-content">
            <div class="no-cards-icon">🎉</div>
            <h2 class="no-cards-title">No cards to review!</h2>
            <p class="no-cards-text">You're all caught up for now.</p>
            <button class="back-to-dashboard-btn" onclick="window.location.href='/dashboard'">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
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
    // Card flip on click (not on buttons)
    flashcard.addEventListener('click', (e) => {
        if (e.target.closest('.audio-btn-large') || e.target.closest('.rating-btn')) {
            return;
        }
        if (!isFlipped) {
            flipCard();
        }
    });

    // Audio buttons
    audioFrontBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        playAudio(vocabulary[currentCardIndex]?.english, 'en-US');
    });

    audioBackBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        playAudio(vocabulary[currentCardIndex]?.greek, 'el-GR');
    });

    // Cancel button
    cancelBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = '/dashboard';
    });

    // Restart button
    restartBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        restartSession();
    });

    // Rating buttons
    ratingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rating = btn.dataset.rating;
            handleRating(rating);
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);
}

// ========================================
// CARD LOADING
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
// AUDIO PLAYBACK (SPEECH SYNTHESIS)
// ========================================
function playAudio(text, lang) {
    if (!text) {
        console.warn('No text to speak');
        return;
    }

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang;
        utterance.rate = 0.82;  // Slower for better comprehension
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        // Try to select best voice for language
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find(v => v.lang === lang || v.lang.startsWith(lang.split('-')[0]));
        if (voice) {
            utterance.voice = voice;
            console.log(`🔊 Using voice: ${voice.name} (${voice.lang})`);
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

    console.log(`✅ Rated: ${rating} – ${card.english} → ${card.greek}`);

    await updateCardSRS(card, rating);

    cardsReviewed++;

    if (currentCardIndex >= vocabulary.length - 1) {
        showCompletionScreen();
        return;
    }

    nextCard();
}

// ========================================
// UPDATE SRS DATA (Spaced Repetition System)
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

    console.log(`SRS: ease ${(card.ease || 2.5).toFixed(2)} → ${newEase.toFixed(2)}, interval → ${newInterval}d, due → ${formattedDueDate}`);

    // Update card object
    card.ease = newEase;
    card.interval = newInterval;
    card.due_date = formattedDueDate;

    await saveCardProgress(card);
}

// ========================================
// SAVE CARD PROGRESS TO SUPABASE
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
                console.error('❌ Supabase save error:', error);
            } else {
                console.log('💾 Progress saved to Supabase');
            }
        } catch (e) {
            console.error('❌ Save error:', e);
        }
    } else {
        // Fallback: Save to localStorage
        try {
            const progressData = JSON.parse(localStorage.getItem('flashcard_progress') || '{}');
            progressData[card.english] = {
                ease: card.ease,
                interval: card.interval,
                due_date: card.due_date,
                last_reviewed: new Date().toISOString()
            };
            localStorage.setItem('flashcard_progress', JSON.stringify(progressData));
            console.log('💾 Progress saved to localStorage');
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
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
// UPDATE PROGRESS BAR
// ========================================
function updateProgress() {
    const progress = ((currentCardIndex + 1) / vocabulary.length) * 100;
    progressFill.style.width = `${progress}%`;
}

// ========================================
// SHOW COMPLETION SCREEN
// ========================================
function showCompletionScreen() {
    flashcard.classList.add('fade-out');

    setTimeout(() => {
        cardContainer.style.display = 'none';
        document.querySelector('.rating-buttons').style.display = 'none';
        document.querySelector('.progress-wrapper').style.display = 'none';

        cardsReviewedSpan.textContent = cardsReviewed;
        completionScreen.classList.add('active');
    }, 500);
}

// ========================================
// RESTART SESSION
// ========================================
function restartSession() {
    currentCardIndex = 0;
    cardsReviewed = 0;
    isFlipped = false;

    completionScreen.classList.remove('active');
    cardContainer.style.display = 'block';
    document.querySelector('.rating-buttons').style.display = 'flex';
    document.querySelector('.progress-wrapper').style.display = 'block';

    loadCard(currentCardIndex);
    updateProgress();

    console.log('🔄 Session restarted');
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

    // Rating shortcuts (when flipped)
    if (isFlipped) {
        if (e.key === '1') handleRating('good');
        if (e.key === '2') handleRating('very-good');
        if (e.key === '3') handleRating('easy');
    }

    // Audio shortcut
    if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        if (!isFlipped) {
            playAudio(vocabulary[currentCardIndex]?.english, 'en-US');
        } else {
            playAudio(vocabulary[currentCardIndex]?.greek, 'el-GR');
        }
    }

    // Escape to cancel
    if (e.key === 'Escape') {
        window.location.href = '/dashboard';
    }
}

// ========================================
// START APP
// ========================================
init();

console.log('🏛️ Greek Flashcards System loaded');
console.log('⌨️ Shortcuts: Space=Flip, 1/2/3=Rate, A=Audio, Esc=Exit');
