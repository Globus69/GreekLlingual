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
// PHRASE DATA
// ========================================
let phrases = [];
let currentPhraseIndex = 0;
let phrasesReviewed = 0;
const DECK_ID = 'c8852ed2-ebb9-414c-ac90-4867c562561e';

// ========================================
// SPEECH SYNTHESIS
// ========================================
window.speechSynthesis.onvoiceschanged = () => {
    console.log('✅ Voices loaded:', window.speechSynthesis.getVoices().length);
};

// ========================================
// DOM ELEMENTS
// ========================================
const phraseCard = document.getElementById('phraseCard');
const greekPhrase = document.getElementById('greekPhrase');
const englishTranslation = document.getElementById('englishTranslation');
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

    // Load phrases from Supabase
    phrases = await loadPhrasesFromSupabase();

    // Show message if no phrases available
    if (phrases.length === 0) {
        showNoPhrasesMessage();
        return;
    }

    totalCards.textContent = phrases.length;
    loadPhrase(currentPhraseIndex);
    updateProgress();
    attachEventListeners();

    console.log(`💬 Daily Phrases | Phrases: ${phrases.length}`);
}

// ========================================
// LOAD PHRASES FROM SUPABASE
// ========================================
async function loadPhrasesFromSupabase() {
    if (!useSupabase || !currentUser) {
        console.log('⚠️ Supabase unavailable or no user');
        return [];
    }

    try {
        // Load phrases from the 'daily_phrases' table
        const { data: phrasesData, error } = await supabase
            .from('daily_phrases')
            .select('*')
            .eq('deck_id', DECK_ID)
            .order('created_at', { ascending: true });

        if (error) {
            console.error('❌ Phrases error:', error);
            return [];
        }

        if (!phrasesData || phrasesData.length === 0) {
            console.log('⚠️ No phrases found for deck');
            return [];
        }

        console.log(`📦 Loaded ${phrasesData.length} phrases from Supabase`);

        // Shuffle phrases for daily variety
        return shuffleArray(phrasesData);

    } catch (error) {
        console.error('❌ Error loading phrases:', error);
        return [];
    }
}

// ========================================
// SHOW NO PHRASES MESSAGE
// ========================================
function showNoPhrasesMessage() {
    mainCardArea.style.display = 'none';
    document.querySelector('.progress-wrapper').style.display = 'none';

    const message = document.createElement('div');
    message.className = 'completion-screen active';
    message.innerHTML = `
        <div class="completion-content">
            <div class="completion-icon">💬</div>
            <h2 class="completion-title">No phrases available!</h2>
            <p class="completion-text">Check back later for daily phrases.</p>
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
    console.log('  ratingButtons:', ratingButtons.length);

    // Audio button - play Greek phrase
    audioBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        const currentPhrase = phrases[currentPhraseIndex];
        if (currentPhrase) {
            playAudio(currentPhrase.greek_phrase, 'el-GR');
        }
    });

    // Cancel button - return to dashboard
    if (cancelBtn) {
        cancelBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            e.preventDefault();
            console.log('🚪 Cancel button clicked - returning to dashboard');
            window.location.href = '/dashboard';
        });
    } else {
        console.error('❌ Cancel button not found!');
    }

    // Restart button - reload phrases
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
// LOAD PHRASE
// ========================================
function loadPhrase(index) {
    const phrase = phrases[index] || {};

    // Load Greek phrase from database
    greekPhrase.textContent = phrase.greek_phrase || '—';
    
    // Load English translation from database
    englishTranslation.textContent = phrase.english_translation || '—';

    currentCardNum.textContent = index + 1;
}

// ========================================
// AUDIO (SPEECH SYNTHESIS)
// ========================================
function playAudio(text, lang) {
    if (!text) {
        console.warn('No text');
        return;
    }

    // Remove line breaks for better pronunciation
    const cleanText = text.replace(/\n/g, ' ');

    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.lang = lang;
        utterance.rate = 0.85;
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
    const phrase = phrases[currentPhraseIndex];
    if (!phrase) return;

    console.log(`✅ Rated: ${rating} - ${phrase.greek_phrase}`);

    await savePhraseProgress(phrase, rating);
    phrasesReviewed++;

    if (currentPhraseIndex >= phrases.length - 1) {
        showCompletionScreen();
        return;
    }

    nextPhrase();
}

// ========================================
// SAVE PROGRESS TO STUDENT_PROGRESS TABLE
// ========================================
async function savePhraseProgress(phrase, rating) {
    const qualityMap = { 'good': 3, 'very-good': 4, 'easy': 5 };
    const quality = qualityMap[rating] || 3;

    // SM-2 Algorithm
    const currentEase = phrase.ease || 2.5;
    let newEase = currentEase + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
    newEase = Math.max(1.3, Math.min(3.0, newEase));

    let newInterval = quality < 3 ? 1 : (phrase.interval || 1) * newEase;
    newInterval = Math.round(newInterval);

    const newDueDate = new Date();
    newDueDate.setDate(newDueDate.getDate() + newInterval);
    const formattedDueDate = newDueDate.toISOString().split('T')[0];

    console.log(`SRS: ease ${currentEase.toFixed(2)} → ${newEase.toFixed(2)}, interval ${newInterval}d, due ${formattedDueDate}`);

    // Update phrase object
    phrase.ease = newEase;
    phrase.interval = newInterval;
    phrase.due_date = formattedDueDate;

    if (useSupabase && currentUser && phrase.id) {
        try {
            const progressRecord = {
                student_id: currentUser.id,
                phrase_id: phrase.id,
                ease: newEase,
                interval: newInterval,
                due_date: formattedDueDate,
                last_reviewed: new Date().toISOString(),
                correct_count: (phrase.correct_count || 0) + 1,
                attempts: (phrase.attempts || 0) + 1
            };

            // Upsert into student_progress table with phrase_id
            const { error } = await supabase
                .from('student_progress')
                .upsert(progressRecord, {
                    onConflict: 'student_id,phrase_id'
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
            const progressData = JSON.parse(localStorage.getItem('phrase_progress') || '{}');
            progressData[phrase.id || phrase.greek_phrase] = {
                ease: newEase,
                interval: newInterval,
                due_date: formattedDueDate,
                last_reviewed: new Date().toISOString()
            };
            localStorage.setItem('phrase_progress', JSON.stringify(progressData));
            console.log('💾 Saved to localStorage');
        } catch (e) {
            console.warn('Failed to save:', e);
        }
    }
}

// ========================================
// NEXT PHRASE
// ========================================
function nextPhrase() {
    phraseCard.classList.add('fade-out');

    setTimeout(() => {
        currentPhraseIndex++;
        loadPhrase(currentPhraseIndex);
        updateProgress();

        phraseCard.classList.remove('fade-out');
        phraseCard.classList.add('fade-in');

        setTimeout(() => phraseCard.classList.remove('fade-in'), 500);
    }, 500);
}

// ========================================
// UPDATE PROGRESS
// ========================================
function updateProgress() {
    const progress = ((currentPhraseIndex + 1) / phrases.length) * 100;
    progressFill.style.width = `${progress}%`;
}

// ========================================
// COMPLETION SCREEN
// ========================================
function showCompletionScreen() {
    phraseCard.classList.add('fade-out');

    setTimeout(() => {
        mainCardArea.style.display = 'none';
        document.querySelector('.progress-wrapper').style.display = 'none';

        phrasesReviewedSpan.textContent = phrasesReviewed;
        completionScreen.classList.add('active');
    }, 500);
}

// ========================================
// RESTART SESSION
// ========================================
async function restartSession() {
    console.log('🔄 Restarting session...');

    // Reset counters
    currentPhraseIndex = 0;
    phrasesReviewed = 0;

    // Reload phrases from Supabase
    const reloadedPhrases = await loadPhrasesFromSupabase();

    if (reloadedPhrases.length > 0) {
        phrases = reloadedPhrases;
        console.log(`✅ Reloaded ${phrases.length} phrases`);
    } else {
        // If no phrases from Supabase, shuffle existing phrases
        phrases = shuffleArray([...phrases]);
        console.log('🔀 Shuffled existing phrases');
    }

    // Hide completion screen if visible
    completionScreen.classList.remove('active');

    // Show main card area
    mainCardArea.style.display = 'flex';
    document.querySelector('.progress-wrapper').style.display = 'block';

    // Update UI
    totalCards.textContent = phrases.length;
    loadPhrase(currentPhraseIndex);
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
    // Rating buttons
    if (e.key === '1') handleRating('good');
    if (e.key === '2') handleRating('very-good');
    if (e.key === '3') handleRating('easy');

    // Audio
    if (e.key === 'a' || e.key === 'A') {
        e.preventDefault();
        playAudio(phrases[currentPhraseIndex]?.greek_phrase, 'el-GR');
    }

    // Escape to cancel - return to dashboard
    if (e.key === 'Escape') {
        window.location.href = '/dashboard';
    }
}

// ========================================
// START
// ========================================
init();

console.log('💬 Daily Phrases System loaded');
console.log('⌨️ Shortcuts: Space=Reveal, 1/2/3=Rate, A=Audio, Esc=Exit');
