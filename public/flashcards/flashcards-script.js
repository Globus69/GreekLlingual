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
let vocabularyWithProgress = []; // Cards merged with progress data
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

    // Load cards from Supabase based on mode
    vocabulary = await loadCardsFromSupabase(currentMode);

    // Show message if no cards available
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
// LOAD CARDS FROM SUPABASE WITH PROGRESS
// ========================================
async function loadCardsFromSupabase(mode) {
    if (!useSupabase || !currentUser) {
        console.log('⚠️ Supabase unavailable or no user');
        return [];
    }

    try {
        const today = new Date().toISOString().split('T')[0];

        // Step 1: Load all vocabs for this deck
        const { data: vocabs, error: vocabError } = await supabase
            .from('vocabs')
            .select('*')
            .eq('deck_id', DECK_ID)
            .order('created_at', { ascending: true });

        if (vocabError) {
            console.error('❌ Vocab error:', vocabError);
            return [];
        }

        if (!vocabs || vocabs.length === 0) {
            console.log('⚠️ No vocabs found for deck');
            return [];
        }

        console.log(`📦 Loaded ${vocabs.length} vocabs from deck`);

        // Step 2: Load student progress for these vocabs
        const vocabIds = vocabs.map(v => v.id);
        const { data: progressData, error: progressError } = await supabase
            .from('student_progress')
            .select('*')
            .eq('student_id', currentUser.id)
            .in('vocab_id', vocabIds);

        if (progressError) {
            console.error('❌ Progress error:', progressError);
            // Continue without progress data
        }

        console.log(`📊 Loaded ${progressData?.length || 0} progress records`);

        // Step 3: Merge vocabs with progress
        const progressMap = {};
        if (progressData) {
            progressData.forEach(p => {
                progressMap[p.vocab_id] = p;
            });
        }

        vocabularyWithProgress = vocabs.map(vocab => {
            const progress = progressMap[vocab.id] || {
                ease: 2.5,
                interval: 1,
                due_date: today,
                last_reviewed: null
            };

            return {
                ...vocab,
                ease: progress.ease,
                interval: progress.interval,
                due_date: progress.due_date,
                last_reviewed: progress.last_reviewed,
                progress_id: progress.id // Keep track of progress record ID
            };
        });

        // Step 4: Filter based on mode
        let filteredCards = [];

        switch (mode) {
            case 'weak':
                // Cards with difficulty='hard' OR ease < 2.3
                filteredCards = vocabularyWithProgress.filter(card =>
                    card.difficulty === 'hard' || card.ease < 2.3
                );
                console.log(`🎯 Weak mode: ${filteredCards.length} cards (difficulty=hard OR ease<2.3)`);
                break;

            case 'due':
                // Cards with due_date <= today
                filteredCards = vocabularyWithProgress.filter(card =>
                    card.due_date <= today
                );
                console.log(`📅 Due mode: ${filteredCards.length} cards (due_date<=${today})`);
                break;

            case 'review':
            default:
                // All cards
                filteredCards = vocabularyWithProgress;
                console.log(`🔄 Review mode: ${filteredCards.length} cards (all)`);
                break;
        }

        console.log(`✅ Loaded ${filteredCards.length} cards for mode: ${mode}`);
        return filteredCards;

    } catch (error) {
        console.error('❌ Error loading cards:', error);
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
    console.log('🎯 Attaching event listeners...');
    console.log('  flashcard:', flashcard);
    console.log('  cardInner:', cardInner);
    console.log('  ratingButtons:', ratingButtons.length);

    // CRITICAL: Flip when clicking on the card (not on buttons)
    // The button-bar is outside the flashcard element in the DOM

    // Add click listener to card-inner (the actual card)
    if (!cardInner) {
        console.error('❌ cardInner element not found!');
        return;
    }

    cardInner.addEventListener('click', (e) => {
        console.log('🖱️ Card clicked!');

        // Check if click originated from audio button
        if (e.target.closest('.audio-btn-back')) {
            return;
        }

        // Flip the card
        if (!isFlipped) {
            flipCard();
        }
    });

    // Audio button (only on back)
    audioBackBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        playAudio(vocabulary[currentCardIndex]?.greek, 'el-GR');
    });

    // Cancel button - return to dashboard
    cancelBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        window.location.href = '/dashboard';
    });

    // Restart button - reload current mode
    restartBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        await restartSession();
    });

    // Rating buttons - trigger handleRating with dataset.rating
    ratingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rating = btn.dataset.rating;
            if (rating) {
                handleRating(rating);
            }
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
    if (!flashcard) {
        console.error('❌ Flashcard element not found!');
        return;
    }

    console.log('🔄 Flipping card');
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

    // SM-2 Algorithm
    let newEase = (card.ease || 2.5) + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEase = Math.max(1.3, Math.min(3.0, newEase));

    let newInterval = quality < 3 ? 1 : (card.interval || 1) * newEase;
    newInterval = Math.round(newInterval);

    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + newInterval);
    const formattedDueDate = newDueDate.toISOString().split('T')[0];

    console.log(`SRS: ease ${(card.ease || 2.5).toFixed(2)} → ${newEase.toFixed(2)}, interval ${newInterval}d, due ${formattedDueDate}`);

    // Update card object
    card.ease = newEase;
    card.interval = newInterval;
    card.due_date = formattedDueDate;

    // Save to student_progress table
    await saveCardProgress(card);
}

// ========================================
// SAVE PROGRESS TO STUDENT_PROGRESS TABLE
// ========================================
async function saveCardProgress(card) {
    if (useSupabase && currentUser && card.id) {
        try {
            const progressRecord = {
                student_id: currentUser.id,
                vocab_id: card.id,
                ease: card.ease,
                interval: card.interval,
                due_date: card.due_date,
                last_reviewed: new Date().toISOString(),
                correct_count: (card.correct_count || 0) + 1,
                attempts: (card.attempts || 0) + 1
            };

            // Upsert: Insert if not exists, Update if exists
            const { error } = await supabase
                .from('student_progress')
                .upsert(progressRecord, {
                    onConflict: 'student_id,vocab_id'
                });

            if (error) {
                console.error('❌ Save error:', error);
            } else {
                console.log('💾 Progress saved to student_progress');
            }
        } catch (e) {
            console.error('❌ Error saving progress:', e);
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
console.log('✅ TEST: Änderung direkt im Hauptprojekt wirksam – ' + new Date().toISOString());
