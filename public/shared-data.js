// ========================================
// SUPABASE CONFIGURATION
// ========================================
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // TODO: Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // TODO: Replace with your Supabase Anon Key

let supabase = null;
let currentUser = null;
let useSupabase = false;

// Initialize Supabase (only if configured)
if (SUPABASE_URL !== 'YOUR_SUPABASE_URL' && typeof window.supabase !== 'undefined') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    useSupabase = true;
    console.log('✅ Supabase initialized in flashcards');
} else {
    console.log('⚠️ Using LocalStorage mode (Supabase not configured)');
}

// ========================================
// VOCABULARY DATA - Uses shared-data.js or Supabase
// ========================================
let vocabulary = [];
let currentMode = 'review'; // 'weak', 'review', or 'due'

// ========================================
// Lade Karten aus shared-data.js (Fallback)
// ========================================
if (typeof window.allFlashcards !== 'undefined' && Array.isArray(window.allFlashcards) && window.allFlashcards.length > 0) {
    vocabulary = window.allFlashcards;
    console.log(`✅ ${vocabulary.length} Karten aus shared-data.js geladen`);
} else {
    console.warn('⚠️ Keine Karten in shared-data.js gefunden oder allFlashcards nicht definiert');
}

// ========================================
// Oder aus Supabase (wenn konfiguriert)
// ========================================
if (useSupabase) {
    async function loadFromSupabase() {
        try {
            const { data, error } = await supabase
                .from('vocabs')
                .select('*')
                .eq('deck_id', 'c8852ed2-ebb9-414c-ac90-4867c562561e');

            if (error) {
                console.error('Supabase Fehler:', error);
            } else if (data && data.length > 0) {
                vocabulary = data;
                console.log(`✅ ${vocabulary.length} Karten aus Supabase geladen`);
            }
        } catch (e) {
            console.error('❌ Fehler beim Supabase-Laden:', e);
        }
    }

    loadFromSupabase();
}

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
const ratingButtons = document.querySelectorAll('.rating-btn');
const progressFill = document.getElementById('progressFill');
const currentCardNum = document.getElementById('currentCardNum');
const totalCards = document.getElementById('totalCards');
const completionScreen = document.getElementById('completionScreen');
const cardsReviewedSpan = document.getElementById('cardsReviewed');
const backToDashboardBtn = document.getElementById('backToDashboard');

// ========================================
// INITIALIZATION
// ========================================
async function init() {
    // Check Supabase authentication
    if (useSupabase) {
        const { data: { user } } = await supabase.auth.getUser();
        currentUser = user;
        console.log('👤 Current user:', user?.email || 'Not logged in');
    }

    // Get mode from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentMode = urlParams.get('mode') || 'review';

    // Update mode header
    updateModeHeader(currentMode);

    // Load cards – TEST-MODUS: immer alle anzeigen
    vocabulary = await getCardsForMode(currentMode);

    console.log(`Karten geladen: ${vocabulary.length}`);

    // Check if there are cards to review
    if (vocabulary.length === 0) {
        showNoCardsMessage();
        return;
    }

    // Set total cards
    totalCards.textContent = vocabulary.length;

    // Load first card
    loadCard(currentCardIndex);

    // Update progress bar
    updateProgress();

    // Attach event listeners
    attachEventListeners();

    // Log mode info
    console.log(`📚 Mode: ${currentMode}`);
    console.log(`🔢 Cards loaded: ${vocabulary.length}`);
    console.log(`🔄 Data source: ${useSupabase && currentUser ? 'Supabase' : 'LocalStorage'}`);
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
            subtitle: "Let's strengthen these!"
        },
        review: {
            title: '🔄 Review Vocabulary',
            subtitle: 'Refresh your knowledge ♡'
        },
        due: {
            title: '📚 Due Cards Today',
            subtitle: 'Your daily repeats'
        }
    };

    const config = modeConfig[mode] || modeConfig.review;
    modeTitle.textContent = config.title;
    modeSubtitle.textContent = config.subtitle;
}

// ========================================
// GET CARDS BASED ON MODE (TEST: immer alle anzeigen)
// ========================================
async function getCardsForMode(mode) {
    console.log(`Modus: ${mode} – TEST-MODUS: Zeige ALLE verfügbaren Karten`);

    let cards = [];

    // 1. shared-data.js (Fallback)
    if (typeof window.allFlashcards !== 'undefined' && Array.isArray(window.allFlashcards) && window.allFlashcards.length > 0) {
        cards = window.allFlashcards;
        console.log(`✅ ${cards.length} Karten aus shared-data.js geladen`);
    } else {
        console.warn('⚠️ Keine Karten in shared-data.js gefunden');
    }

    // 2. Supabase (falls konfiguriert)
    if (useSupabase && currentUser) {
        try {
            const { data, error } = await supabase
                .from('vocabs')
                .select('*')
                .eq('deck_id', 'c8852ed2-ebb9-414c-ac90-4867c562561e');

            if (error) {
                console.error('Supabase Fehler:', error);
            } else if (data && data.length > 0) {
                cards = data;
                console.log(`✅ ${cards.length} Karten aus Supabase geladen`);
            }
        } catch (e) {
            console.error('❌ Fehler beim Supabase-Laden:', e);
        }
    }

    // 3. Harter Test-Fallback, falls wirklich nichts da ist
    if (cards.length === 0) {
        cards = [
            { english: "Hello", greek: "Γεια σου", translit: "Geia sou", context_en: "Greeting", difficulty: "easy" },
            { english: "Thank you", greek: "Ευχαριστώ", translit: "Efcharistó", context_en: "Gratitude", difficulty: "hard" },
            { english: "Water", greek: "Νερό", translit: "Neró", context_en: "Drink", difficulty: "easy" }
        ];
        console.log('⚠️ TEST-FALLBACK: 3 Karten erzwungen');
    }

    return cards;
}

// ========================================
// HELPER: Get Today's Date String
// ========================================
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ========================================
// SHOW NO CARDS MESSAGE
// ========================================
function showNoCardsMessage() {
    cardContainer.style.display = 'none';
    document.querySelector('.progress-wrapper').style.display = 'none';

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
    // Card flip on click
    flashcard.addEventListener('click', (e) => {
        if (e.target.closest('.audio-btn-large') || e.target.closest('.rating-btn')) {
            return;
        }

        if (!isFlipped) {
            flipCard();
        }
    });

    // Audio buttons
    audioFrontBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playAudio(vocabulary[currentCardIndex].audioEn, vocabulary[currentCardIndex].english);
    });

    audioBackBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        playAudio(vocabulary[currentCardIndex].audioGr, vocabulary[currentCardIndex].greek);
    });

    // Rating buttons
    ratingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rating = btn.dataset.rating;
            handleRating(rating);
        });
    });

    // Back to Dashboard button
    backToDashboardBtn.addEventListener('click', () => {
        window.location.href = '/dashboard';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);
}

// ========================================
// CARD LOADING
// ========================================
function loadCard(index) {
    const card = vocabulary[index];

    wordFront.textContent = card.english || '—';
    contextFront.textContent = card.context_en || '';

    wordBack.textContent = card.greek || '—';
    contextBack.textContent = card.context_gr || '';

    isFlipped = false;
    flashcard.classList.remove('flipped');

    currentCardNum.textContent = index + 1;
}

// ========================================
// FLIP ANIMATION
// ========================================
function flipCard() {
    flashcard.classList.add('flipped');
    isFlipped = true;
    console.log('Karte geflippt');
}

// ========================================
// AUDIO PLAYBACK
// ========================================
function playAudio(audioFile, text) {
    console.log(`Playing audio for: ${text}`);

    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = /[\u0370-\u03FF]/.test(text) ? 'el-GR' : 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    } else {
        console.warn('Speech synthesis nicht unterstützt');
    }
}

// ========================================
// RATING & PROGRESSION
// ========================================
async function handleRating(rating) {
    const card = vocabulary[currentCardIndex];

    console.log(`Card rated: ${rating} – ${card.english} → ${card.greek}`);

    await updateCardSRS(card, rating);

    cardsReviewed++;

    if (currentCardIndex >= vocabulary.length - 1) {
        showCompletionScreen();
        return;
    }

    nextCard();
}

// ========================================
// UPDATE SRS DATA (Spaced Repetition)
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

    console.log(`SRS Update: ease ${card.ease || 2.5} → ${newEase.toFixed(2)}, interval → ${newInterval}d, due → ${formattedDueDate}`);

    card.ease = newEase;
    card.interval = newInterval;
    card.dueDate = formattedDueDate;

    await saveCardProgress(card);
}

// ========================================
// SAVE CARD PROGRESS
// ========================================
async function saveCardProgress(card) {
    // LocalStorage fallback
    try {
        const progressData = JSON.parse(localStorage.getItem('flashcard_progress') || '{}');
        progressData[card.english] = {
            ease: card.ease,
            interval: card.interval,
            dueDate: card.dueDate,
            lastReviewed: new Date().toISOString()
        };
        localStorage.setItem('flashcard_progress', JSON.stringify(progressData));
        console.log('💾 Progress saved to localStorage');
    } catch (e) {
        console.warn('Failed to save progress:', e);
    }
}

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

function updateProgress() {
    const progress = ((currentCardIndex + 1) / vocabulary.length) * 100;
    progressFill.style.width = `${progress}%`;
}

function showCompletionScreen() {
    flashcard.classList.add('fade-out');

    setTimeout(() => {
        cardContainer.style.display = 'none';
        document.querySelector('.progress-wrapper').style.display = 'none';
        completionScreen.classList.add('active');
    }, 500);
}

function handleKeyPress(e) {
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (!isFlipped) flipCard();
    }

    if (isFlipped) {
        if (e.key === '1') handleRating('good');
        if (e.key === '2') handleRating('very-good');
        if (e.key === '3') handleRating('easy');
    }

    if (e.key === 'ArrowUp') {
        e.preventDefault();
        if (!isFlipped) {
            playAudio(vocabulary[currentCardIndex].audioEn, vocabulary[currentCardIndex].english);
        } else {
            playAudio(vocabulary[currentCardIndex].audioGr, vocabulary[currentCardIndex].greek);
        }
    }
}

// ========================================
// START APP
// ========================================
init();

console.log('🏛️ Greek Flashcards loaded');
console.log(`📚 ${vocabulary.length} cards ready for review`);
console.log('⌨️ Tasten: Space = Flip, 1/2/3 = Bewerten, ↑ = Audio');