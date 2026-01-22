// ========================================
// SUPABASE CONFIGURATION
// ========================================
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // TODO: Replace with your Supabase URL
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // TODO: Replace with your Supabase Anon Key

let supabase = null;
let currentUser = null;
let useSupabase = false; // Set to true when Supabase is configured

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
if (typeof window.allFlashcards !== 'undefined' && window.allFlashcards.length > 0) {
    vocabulary = window.allFlashcards;
    console.log(`✅ ${vocabulary.length} Karten aus shared-data.js geladen`);
} else {
    console.log('⚠️ Keine Karten in shared-data.js gefunden');
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
                .eq('deck_id', 'c8852ed2-ebb9-414c-ac90-4867c562561e'); // deine Deck-ID

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

    // Load cards based on mode (Supabase or LocalStorage)
    vocabulary = await getCardsForMode(currentMode);

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
// GET CARDS BASED ON MODE (Supabase or LocalStorage)
// ========================================
async function getCardsForMode(mode) {
    if (useSupabase && currentUser) {
        try {
            const today = new Date().toISOString().split('T')[0];
            let query = supabase
                .from('flashcard_progress')
                .select('*')
                .eq('user_id', currentUser.id);

            switch (mode) {
                case 'weak':
                    query = query.lt('ease', 2.3).order('ease', { ascending: true });
                    break;

                case 'due':
                    query = query.lte('due_date', today).order('due_date', { ascending: true });
                    break;

                case 'review':
                default:
                    query = query.order('ease', { ascending: true });
                    break;
            }

            const { data, error } = await query;

            if (error) {
                console.error('❌ Supabase error:', error);
                return [];
            }

            console.log(`✅ Loaded ${data.length} cards from Supabase`);

            return data.map(card => ({
                id: card.id,
                english: card.word || card.english_word,
                greek: card.greek_word,
                contextEn: card.context_en || '',
                contextGr: card.context_gr || '',
                audioEn: card.audio_en || '',
                audioGr: card.audio_gr || '',
                ease: card.ease || 2.5,
                interval: card.interval || 1,
                dueDate: card.due_date || today,
                lastReviewed: card.last_reviewed
            }));
        } catch (error) {
            console.error('❌ Error fetching cards from Supabase:', error);
            return [];
        }
    } else {
        // LOCALSTORAGE MODE (Fallback)
        if (typeof allFlashcards === 'undefined') {
            console.warn('allFlashcards not loaded from shared-data.js');
            return [];
        }

        loadCardProgress();

        // TEMPORÄR: Zeige ALLE Karten (Filter deaktiviert)
        return allFlashcards;
    }
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

// Rest des Codes bleibt gleich (init(), loadCard(), flipCard(), etc.)
// ... (dein restlicher Code hier)

init();

console.log('🏛️ Greek Flashcards loaded');
console.log(`📚 ${vocabulary.length} cards ready for review`);