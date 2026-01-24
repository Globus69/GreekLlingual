// ========================================
// VOCABULARY DATA - Uses shared-data.js
// ========================================
// allFlashcards array is loaded from shared-data.js
let vocabulary = [];
let currentMode = 'review'; // 'weak', 'review', or 'due'

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
function init() {
    // Get mode from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    currentMode = urlParams.get('mode') || 'review';

    // Update mode header
    updateModeHeader(currentMode);

    // Load cards based on mode
    vocabulary = getCardsForMode(currentMode);

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
// LOAD PROGRESS FROM LOCALSTORAGE
// ========================================
function loadCardProgress() {
    try {
        const progressData = JSON.parse(localStorage.getItem('flashcard_progress') || '{}');

        // Apply saved progress to cards
        allFlashcards.forEach(card => {
            const savedProgress = progressData[card.english];
            if (savedProgress) {
                card.ease = savedProgress.ease || card.ease;
                card.interval = savedProgress.interval || card.interval;
                card.dueDate = savedProgress.dueDate || card.dueDate;
            }
        });

        console.log('📂 Progress loaded from localStorage');
    } catch (e) {
        console.warn('Failed to load progress:', e);
    }
}

// ========================================
// GET CARDS BASED ON MODE
// ========================================
function getCardsForMode(mode) {
    // Use shared-data.js (allFlashcards)
    if (typeof allFlashcards === 'undefined') {
        console.warn('allFlashcards not loaded from shared-data.js');
        return [];
    }

    // Load saved progress first
    loadCardProgress();

    const today = getTodayDateString();

    switch (mode) {
        case 'weak':
            // Cards with ease < 2.3 (difficult cards that need more practice)
            // Sort by ease (lowest first = hardest first)
            return allFlashcards
                .filter(card => card.ease < 2.3)
                .sort((a, b) => a.ease - b.ease);

        case 'due':
            // Cards with dueDate <= today (SRS-based)
            // Sort by dueDate (oldest first)
            return allFlashcards
                .filter(card => card.dueDate <= today)
                .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate));

        case 'review':
        default:
            // All cards, prioritize weak and due cards first
            return allFlashcards.sort((a, b) => {
                // First: weak cards (ease < 2.3)
                if (a.ease < 2.3 && b.ease >= 2.3) return -1;
                if (a.ease >= 2.3 && b.ease < 2.3) return 1;

                // Then: due cards
                if (a.dueDate <= today && b.dueDate > today) return -1;
                if (a.dueDate > today && b.dueDate <= today) return 1;

                // Finally: by ease (harder first)
                return a.ease - b.ease;
            });
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
            <button class="back-to-dashboard-btn" onclick="window.location.href='./web/index.html'">
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
        // Prevent flip when clicking buttons
        if (e.target.closest('.audio-btn-large') ||
            e.target.closest('.rating-btn')) {
            return;
        }

        // Only flip if not already flipped
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
        window.location.href = './web/index.html';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);
}

// ========================================
// CARD LOADING
// ========================================
function loadCard(index) {
    const card = vocabulary[index];

    // Update front face
    wordFront.textContent = card.english;
    contextFront.textContent = card.contextEn || '';

    // Update back face
    wordBack.textContent = card.greek;
    contextBack.textContent = card.contextGr || '';

    // Reset flip state
    isFlipped = false;
    flashcard.classList.remove('flipped');

    // Update progress
    currentCardNum.textContent = index + 1;
}

// ========================================
// FLIP ANIMATION
// ========================================
function flipCard() {
    flashcard.classList.add('flipped');
    isFlipped = true;
}

// ========================================
// AUDIO PLAYBACK
// ========================================
function playAudio(audioFile, text) {
    console.log(`Playing audio: ${audioFile}`);

    // Visual feedback
    const btn = event.target.closest('.audio-btn-large');
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => {
        btn.style.transform = '';
    }, 150);

    // Web Speech API for Text-to-Speech
    if ('speechSynthesis' in window) {
        speakText(text);
    } else {
        console.log('Speech synthesis not supported');
    }

    // In production with real audio files:
    // new Audio(audioFile).play();
}

// ========================================
// TEXT-TO-SPEECH
// ========================================
function speakText(text) {
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);

    // Detect language
    if (/[\u0370-\u03FF\u1F00-\u1FFF]/.test(text)) {
        // Greek characters detected
        utterance.lang = 'el-GR';
    } else {
        // English
        utterance.lang = 'en-US';
    }

    utterance.rate = 0.9;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;

    window.speechSynthesis.speak(utterance);
}

// ========================================
// RATING & PROGRESSION
// ========================================
function handleRating(rating) {
    const card = vocabulary[currentCardIndex];

    console.log(`Card rated: ${rating}`);
    console.log(`Card: ${card.english} → ${card.greek}`);

    // Update SRS data (ease, interval, dueDate)
    updateCardSRS(card, rating);

    // Increment reviewed count
    cardsReviewed++;

    // Check if this is the last card
    if (currentCardIndex >= vocabulary.length - 1) {
        // Show completion screen
        showCompletionScreen();
        return;
    }

    // Move to next card with animation
    nextCard();
}

// ========================================
// UPDATE SRS DATA (Spaced Repetition)
// ========================================
function updateCardSRS(card, rating) {
    // SM-2 Algorithm (simplified)
    // Rating: 'good' = quality 3, 'very-good' = quality 4, 'easy' = quality 5

    const qualityMap = {
        'good': 3,
        'very-good': 4,
        'easy': 5
    };

    const quality = qualityMap[rating] || 3;

    // Calculate new ease factor
    let newEase = card.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

    // Ease factor boundaries: 1.3 to 3.0
    newEase = Math.max(1.3, Math.min(3.0, newEase));

    // Calculate new interval
    let newInterval;

    if (quality < 3) {
        // Failed card: reset interval to 1 day
        newInterval = 1;
    } else if (card.interval === 0) {
        // First time: 1 day
        newInterval = 1;
    } else if (card.interval === 1) {
        // Second time: 6 days
        newInterval = 6;
    } else {
        // Use ease factor
        newInterval = Math.round(card.interval * newEase);
    }

    // Calculate new due date
    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + newInterval);
    const formattedDueDate = newDueDate.toISOString().split('T')[0];

    // Log update
    console.log(`📊 SRS Update:`, {
        word: card.english,
        ease: `${card.ease.toFixed(2)} → ${newEase.toFixed(2)}`,
        interval: `${card.interval}d → ${newInterval}d`,
        dueDate: `${card.dueDate} → ${formattedDueDate}`
    });

    // Update card data (in-memory only)
    // In production: save to Supabase/localStorage
    card.ease = newEase;
    card.interval = newInterval;
    card.dueDate = formattedDueDate;

    // Optional: Save to localStorage for persistence
    saveCardProgress(card);
}

// ========================================
// SAVE CARD PROGRESS (LocalStorage)
// ========================================
function saveCardProgress(card) {
    try {
        // Get existing progress data
        const progressData = JSON.parse(localStorage.getItem('flashcard_progress') || '{}');

        // Update card progress
        progressData[card.english] = {
            ease: card.ease,
            interval: card.interval,
            dueDate: card.dueDate,
            lastReviewed: new Date().toISOString()
        };

        // Save back to localStorage
        localStorage.setItem('flashcard_progress', JSON.stringify(progressData));

        console.log('💾 Progress saved to localStorage');
    } catch (e) {
        console.warn('Failed to save progress:', e);
    }
}

function nextCard() {
    // Fade out current card
    flashcard.classList.add('fade-out');

    setTimeout(() => {
        // Move to next card
        currentCardIndex++;
        loadCard(currentCardIndex);
        updateProgress();

        // Fade in new card
        flashcard.classList.remove('fade-out');
        flashcard.classList.add('fade-in');

        setTimeout(() => {
            flashcard.classList.remove('fade-in');
        }, 500);
    }, 500);
}

// ========================================
// PROGRESS BAR UPDATE
// ========================================
function updateProgress() {
    const progress = ((currentCardIndex + 1) / vocabulary.length) * 100;
    progressFill.style.width = `${progress}%`;
}

// ========================================
// COMPLETION SCREEN
// ========================================
function showCompletionScreen() {
    // Fade out card
    flashcard.classList.add('fade-out');

    setTimeout(() => {
        // Hide card container
        cardContainer.style.display = 'none';

        // Update stats
        cardsReviewedSpan.textContent = cardsReviewed;

        // Show completion screen
        completionScreen.classList.add('active');
    }, 500);
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================
function handleKeyPress(e) {
    // Space bar to flip card
    if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        if (!isFlipped) {
            flipCard();
        }
    }

    // Number keys for rating (only when flipped)
    if (isFlipped) {
        if (e.key === '1') {
            handleRating('good');
        } else if (e.key === '2') {
            handleRating('very-good');
        } else if (e.key === '3') {
            handleRating('easy');
        }
    }

    // Arrow keys for audio
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
console.log('⌨️ Keyboard shortcuts:');
console.log('  Space - Flip card');
console.log('  1/2/3 - Rate (Good/Very Good/Easy)');
console.log('  ↑ - Play audio');
