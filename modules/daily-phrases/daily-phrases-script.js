// ========================================
// SUPABASE CONFIGURATION
// ========================================
const SUPABASE_URL = 'https://bzdzqmnxycnudflcnmzj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uT0wv5-tv95ETP0u16h8zg_Ni3WqAIo';

// Use window.supabaseClient to avoid conflict with CDN's global supabase variable
let supabaseClient = null;
let currentUser = null;
let useSupabase = false;

// Initialize Supabase - wait for script to load
function initializeSupabase() {
    try {
        // The CDN script exposes supabase as a global variable
        // Check multiple possible locations
        let SupabaseLibrary = null;
        
        // Check global supabase variable (from CDN) - use window to avoid conflict
        if (typeof window.supabase !== 'undefined') {
            if (window.supabase.createClient) {
                SupabaseLibrary = window.supabase;
            } else if (window.supabase.default && window.supabase.default.createClient) {
                SupabaseLibrary = window.supabase.default;
            }
        }
        
        // Also check if supabase is available globally (not as window property)
        if (!SupabaseLibrary && typeof supabase !== 'undefined') {
            if (supabase.createClient) {
                SupabaseLibrary = supabase;
            } else if (supabase.default && supabase.default.createClient) {
                SupabaseLibrary = supabase.default;
            }
        }
        
        if (SupabaseLibrary && SupabaseLibrary.createClient) {
            supabaseClient = SupabaseLibrary.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            useSupabase = true;
            console.log('✅ Supabase initialized successfully');
            console.log('   URL:', SUPABASE_URL);
            return true;
        } else {
            console.warn('⚠️ Supabase library not found. Available globals:', Object.keys(window).filter(k => k.toLowerCase().includes('supabase')));
            return false;
        }
    } catch (err) {
        console.error('❌ Error initializing Supabase:', err);
        return false;
    }
}

// Listen for Supabase loaded event
window.addEventListener('supabase-loaded', function() {
    if (!useSupabase) {
        initializeSupabase();
    }
});

// Try to initialize Supabase when script loads
// Wait for CDN to load if needed
let initAttempts = 0;
const maxAttempts = 10;

function tryInitializeSupabase() {
    initAttempts++;
    if (initializeSupabase()) {
        return true;
    }
    
    if (initAttempts < maxAttempts) {
        setTimeout(tryInitializeSupabase, 200);
    } else {
        console.error('❌ Failed to initialize Supabase after', maxAttempts, 'attempts');
        console.log('💡 Make sure the Supabase CDN script is loaded in the HTML');
    }
    return false;
}

// Start initialization
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(tryInitializeSupabase, 100);
    });
} else {
    setTimeout(tryInitializeSupabase, 100);
}

// ========================================
// PHRASE DATA
// ========================================
let phrases = [];
let currentPhraseIndex = 0;
let phrasesReviewed = 0;
const DECK_ID = 'c8852ed2-ebb9-414c-ac90-4867c562561e';

// Fallback data if Supabase is not available
const FALLBACK_PHRASES = [
    {
        id: 'fallback-1',
        deck_id: DECK_ID,
        greek_phrase: 'Καλημέρα!',
        english_translation: 'Good morning!',
        category: 'greetings',
        difficulty: 'easy'
    },
    {
        id: 'fallback-2',
        deck_id: DECK_ID,
        greek_phrase: 'Καλησπέρα!',
        english_translation: 'Good evening!',
        category: 'greetings',
        difficulty: 'easy'
    },
    {
        id: 'fallback-3',
        deck_id: DECK_ID,
        greek_phrase: 'Πώς είσαι;',
        english_translation: 'How are you?',
        category: 'greetings',
        difficulty: 'easy'
    },
    {
        id: 'fallback-4',
        deck_id: DECK_ID,
        greek_phrase: 'Ευχαριστώ πολύ.',
        english_translation: 'Thank you very much.',
        category: 'courtesy',
        difficulty: 'easy'
    },
    {
        id: 'fallback-5',
        deck_id: DECK_ID,
        greek_phrase: 'Παρακαλώ.',
        english_translation: 'Please.',
        category: 'courtesy',
        difficulty: 'easy'
    },
    {
        id: 'fallback-6',
        deck_id: DECK_ID,
        greek_phrase: 'Συγνώμη.',
        english_translation: 'Sorry.',
        category: 'courtesy',
        difficulty: 'easy'
    },
    {
        id: 'fallback-7',
        deck_id: DECK_ID,
        greek_phrase: 'Τι ώρα είναι;',
        english_translation: 'What time is it?',
        category: 'time',
        difficulty: 'medium'
    },
    {
        id: 'fallback-8',
        deck_id: DECK_ID,
        greek_phrase: 'Πού είναι η τουαλέτα;',
        english_translation: 'Where is the restroom?',
        category: 'directions',
        difficulty: 'easy'
    }
];

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
    console.log('🚀 Initializing Daily Phrases app...');
    
    // Ensure Supabase is initialized
    if (!useSupabase) {
        console.log('🔄 Initializing Supabase...');
        const initialized = initializeSupabase();
        if (!initialized) {
            // Wait a bit more for CDN to load
            await new Promise(resolve => setTimeout(resolve, 500));
            initializeSupabase();
        }
        // Wait a bit for initialization
        await new Promise(resolve => setTimeout(resolve, 300));
    }

    // Get Supabase user (but don't require it for development)
    if (useSupabase && supabaseClient) {
        try {
            const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
            if (userError) {
                console.log('⚠️ Could not get user:', userError.message);
                console.log('   Continuing in anonymous mode (RLS should allow public access)');
                currentUser = null;
            } else {
                currentUser = user;
                console.log('👤 User:', user?.email || 'Anonymous (not logged in)');
                console.log('   User ID:', user?.id || 'none');
            }
        } catch (err) {
            console.log('⚠️ Could not get user, continuing in demo mode:', err);
            currentUser = null;
        }
    } else {
        console.log('👤 User: Not checked (Supabase not initialized)');
        currentUser = null;
    }

    // Attach event listeners AFTER DOM is ready
    attachEventListeners();

    // Load phrases from Supabase
    console.log('📥 Loading phrases...');
    phrases = await loadPhrasesFromSupabase();

    // Show message if no phrases available (should not happen with fallback)
    if (phrases.length === 0) {
        console.warn('⚠️ No phrases loaded, even with fallback');
        showNoPhrasesMessage();
        return;
    }
    
    console.log(`✅ Successfully loaded ${phrases.length} phrases`);

    totalCards.textContent = phrases.length;
    loadPhrase(currentPhraseIndex);
    updateProgress();

    console.log(`✅ Daily Phrases initialized | Phrases: ${phrases.length}`);
}

// ========================================
// LOAD PHRASES FROM SUPABASE
// ========================================
async function loadPhrasesFromSupabase() {
    // Ensure Supabase is initialized
    if (!useSupabase || !supabaseClient) {
        console.log('⚠️ Supabase not initialized, attempting to initialize...');
        const initialized = initializeSupabase();
        if (!initialized) {
            // Wait a bit more for CDN to load
            await new Promise(resolve => setTimeout(resolve, 500));
            initializeSupabase();
        }
        await new Promise(resolve => setTimeout(resolve, 300));
        
        if (!useSupabase || !supabaseClient) {
            console.error('❌ Supabase still unavailable after retry');
            console.log('💡 Using fallback data');
            console.log(`📦 Loaded ${FALLBACK_PHRASES.length} fallback phrases`);
            return shuffleArray([...FALLBACK_PHRASES]);
        }
    }

    try {
        console.log('🔄 Attempting to load phrases from daily_phrases table...');
        console.log('   Deck ID:', DECK_ID);
        console.log('   Supabase client:', supabaseClient ? 'available' : 'missing');
        console.log('   Current user:', currentUser ? currentUser.email : 'none (anonymous)');
        
        // First, try to load ALL phrases to check if table exists and has data
        console.log('📊 Step 1: Checking if table exists and has any data...');
        const { data: allPhrases, error: checkError } = await supabaseClient
            .from('daily_phrases')
            .select('id, deck_id, greek_phrase, english_translation')
            .limit(5);
        
        if (checkError) {
            console.error('❌ Error checking table:', checkError);
            console.error('Error code:', checkError.code);
            console.error('Error message:', checkError.message);
            console.error('Error details:', JSON.stringify(checkError, null, 2));
            
            // If API key is invalid
            if (checkError.message?.includes('Invalid API key') || checkError.message?.includes('401') || checkError.code === 'PGRST301') {
                console.error('⚠️ Invalid Supabase API key');
                console.error('💡 Please check your SUPABASE_ANON_KEY in the script');
                console.error('💡 You can find the correct key in your Supabase project settings');
                console.log('💡 Using fallback data for now');
                return shuffleArray([...FALLBACK_PHRASES]);
            }
            
            // If table doesn't exist, show helpful message
            if (checkError.code === '42P01' || checkError.message?.includes('does not exist')) {
                console.error('⚠️ daily_phrases table does not exist. Please run supabase/insert_test_daily_phrases.sql');
                console.log('💡 Using fallback data');
                return shuffleArray([...FALLBACK_PHRASES]);
            }
            
            // If RLS error, try without authentication
            if (checkError.code === '42501' || checkError.message?.includes('permission') || checkError.message?.includes('policy')) {
                console.warn('⚠️ RLS policy might be blocking access. Using fallback data.');
                return shuffleArray([...FALLBACK_PHRASES]);
            }
            
            // For other errors, use fallback
            console.warn('⚠️ Error accessing Supabase. Using fallback data.');
            return shuffleArray([...FALLBACK_PHRASES]);
        }
        
        console.log(`📊 Found ${allPhrases?.length || 0} total phrases in table`);
        if (allPhrases && allPhrases.length > 0) {
            console.log('   Sample deck_ids:', [...new Set(allPhrases.map(p => p.deck_id))]);
        }
        
        // Now load phrases filtered by deck_id
        console.log('📊 Step 2: Loading phrases for deck_id:', DECK_ID);
        const { data: phrasesData, error } = await supabaseClient
            .from('daily_phrases')
            .select('*')
            .eq('deck_id', DECK_ID)
            .order('created_at', { ascending: true })
            .limit(100); // Increased limit

        if (error) {
            console.error('❌ Phrases error:', error);
            console.error('Error code:', error.code);
            console.error('Error message:', error.message);
            console.error('Error details:', JSON.stringify(error, null, 2));
            
            // If API key is invalid
            if (error.message?.includes('Invalid API key') || error.message?.includes('401') || error.code === 'PGRST301') {
                console.error('⚠️ Invalid Supabase API key');
                console.error('💡 Please check your SUPABASE_ANON_KEY in the script');
                console.log('💡 Using fallback data for now');
                return shuffleArray([...FALLBACK_PHRASES]);
            }
            
            // If no data found for this deck_id, try loading all phrases
            if (error.code === 'PGRST116' || (phrasesData && phrasesData.length === 0)) {
                console.log('⚠️ No phrases found for deck_id:', DECK_ID);
                console.log('🔄 Trying to load phrases without deck_id filter...');
                
                const { data: allPhrasesData, error: allError } = await supabaseClient
                    .from('daily_phrases')
                    .select('*')
                    .order('created_at', { ascending: true })
                    .limit(50);
                
                if (!allError && allPhrasesData && allPhrasesData.length > 0) {
                    console.log(`📦 Loaded ${allPhrasesData.length} phrases (without deck filter)`);
                    console.log('⚠️ Using all available phrases (deck_id filter removed)');
                    return shuffleArray(allPhrasesData);
                }
            }
            
            // If network error, try one more time
            if (error.message?.includes('fetch') || error.message?.includes('network')) {
                console.log('🔄 Network error, retrying once...');
                await new Promise(resolve => setTimeout(resolve, 1000));
                const retry = await supabaseClient
                    .from('daily_phrases')
                    .select('*')
                    .eq('deck_id', DECK_ID)
                    .order('created_at', { ascending: true })
                    .limit(100);
                
                if (!retry.error && retry.data) {
                    console.log(`📦 Loaded ${retry.data.length} phrases from Supabase (retry)`);
                    return shuffleArray(retry.data);
                }
            }
            
            // Use fallback for any other error
            console.log('💡 Using fallback data due to error');
            return shuffleArray([...FALLBACK_PHRASES]);
        }

        if (!phrasesData || phrasesData.length === 0) {
            console.log('⚠️ No phrases found for deck_id:', DECK_ID);
            console.log('💡 Tip: Run supabase/insert_test_daily_phrases.sql to add test data');
            console.log('💡 Or check if the deck_id in the SQL matches:', DECK_ID);
            
            // Try loading without filter as fallback
            console.log('🔄 Trying fallback: loading all phrases...');
            const { data: fallbackData, error: fallbackError } = await supabaseClient
                .from('daily_phrases')
                .select('*')
                .order('created_at', { ascending: true })
                .limit(50);
            
            if (!fallbackError && fallbackData && fallbackData.length > 0) {
                console.log(`📦 Loaded ${fallbackData.length} phrases (fallback - no deck filter)`);
                return shuffleArray(fallbackData);
            }
            
            // Use hardcoded fallback data
            console.log('💡 Using hardcoded fallback phrases');
            return shuffleArray([...FALLBACK_PHRASES]);
        }

        console.log(`✅ Loaded ${phrasesData.length} phrases from Supabase`);
        console.log('   Sample phrase:', phrasesData[0]?.greek_phrase || 'none');

        // Shuffle phrases for daily variety
        return shuffleArray(phrasesData);

    } catch (error) {
        console.error('❌ Error loading phrases:', error);
        console.error('Error stack:', error.stack);
        console.log('💡 Using fallback data due to error');
        return shuffleArray([...FALLBACK_PHRASES]);
    }
}

// ========================================
// SHOW NO PHRASES MESSAGE
// ========================================
function showNoPhrasesMessage() {
    if (mainCardArea) {
        mainCardArea.style.display = 'none';
    }
    const progressWrapper = document.querySelector('.progress-wrapper');
    if (progressWrapper) {
        progressWrapper.style.display = 'none';
    }

    const message = document.createElement('div');
    message.className = 'completion-screen active';
    message.innerHTML = `
        <div class="completion-content">
            <div class="completion-icon">💬</div>
            <h2 class="completion-title">No phrases available!</h2>
            <p class="completion-text">Check back later for daily phrases.</p>
            <button class="back-to-dashboard-btn" id="noPhrasesBackBtn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                </svg>
                Back to Dashboard
            </button>
        </div>
    `;
    document.querySelector('.app-container').appendChild(message);
    
    // Add event listener to back button
    const backBtn = document.getElementById('noPhrasesBackBtn');
    if (backBtn) {
        backBtn.setAttribute('data-debug', '8');
        backBtn.innerHTML = backBtn.innerHTML.replace('Back to Dashboard', '[8] Back to Dashboard');
        backBtn.addEventListener('click', () => {
            console.log('🔘 [DEBUG 8] No phrases back button clicked');
            window.location.href = '/dashboard';
        });
    }
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
        console.log('🔘 [DEBUG 4] Audio button clicked');
        const currentPhrase = phrases[currentPhraseIndex];
        if (currentPhrase) {
            playAudio(currentPhrase.greek_phrase, 'el-GR');
        }
    });

    // Cancel button - return to dashboard (MULTIPLE METHODS FOR RELIABILITY)
    const cancelButton = document.getElementById('cancelBtn');
    if (cancelButton) {
        // Method 1: Inline onclick (already in HTML) - most reliable
        // Method 2: Add event listener as backup
        cancelButton.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 [DEBUG 6] Cancel button clicked (event listener) - navigating to dashboard');
            window.location.href = '/dashboard';
        });
        
        // Method 3: Also handle via onclick property
        const originalOnclick = cancelButton.onclick;
        cancelButton.onclick = function(e) {
            if (originalOnclick) {
                originalOnclick.call(this, e);
            }
            e.preventDefault();
            e.stopPropagation();
            console.log('🔘 [DEBUG 6] Cancel button clicked (onclick property) - navigating to dashboard');
            window.location.href = '/dashboard';
            return false;
        };
        
        // Ensure button type
        cancelButton.type = 'button';
        
        console.log('✅ Cancel button handlers attached (multiple methods)');
    } else {
        console.error('❌ Cancel button not found in DOM!');
    }

    // Restart button - reload phrases
    restartBtn?.addEventListener('click', async (e) => {
        e.stopPropagation();
        console.log('🔘 [DEBUG 5] Restart button clicked');
        await restartSession();
    });

    // Rating buttons - trigger handleRating with dataset.rating
    ratingButtons.forEach((btn, index) => {
        const debugNum = btn.dataset.debug || (index + 1);
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            console.log(`🔘 [DEBUG ${debugNum}] Rating button clicked: ${btn.dataset.rating}`);
            const rating = btn.dataset.rating;
            if (rating) {
                handleRating(rating);
            }
        });
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyPress);

    // English translation container - remove blur on click
    const englishContainer = document.querySelector('.english-translation-container');
    if (englishContainer) {
        englishContainer.addEventListener('click', function() {
            this.classList.remove('blurred');
        });
    }
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

    // Add blur to English translation container
    const englishContainer = document.querySelector('.english-translation-container');
    if (englishContainer) {
        englishContainer.classList.add('blurred');
    }

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
    // Map ratings to quality scores (matching Vocabulary Dialog)
    // Hard (1) -> quality 1, Good (2) -> quality 2.5, Easy (3) -> quality 3
    const qualityMap = { 'hard': 1, 'good': 2.5, 'easy': 3, 'very-good': 4 };
    const quality = qualityMap[rating] || 2.5;

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
            const { error } = await supabaseClient
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
    // Rating buttons (matching Vocabulary Dialog)
    if (e.key === '1') handleRating('hard');
    if (e.key === '2') handleRating('good');
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
// START - Wait for Supabase CDN to load
// ========================================
// Wait for DOM and Supabase CDN to be ready
function startApp() {
    // Check if Supabase is available
    if (!useSupabase) {
        const supabaseAvailable = initializeSupabase();
        if (!supabaseAvailable) {
            // Wait a bit more and try again
            setTimeout(() => {
                if (!useSupabase) {
                    initializeSupabase();
                }
                init();
            }, 500);
            return;
        }
    }
    
    // Initialize the app
    init();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(startApp, 300);
    });
} else {
    setTimeout(startApp, 300);
}

console.log('💬 Daily Phrases System loading...');
console.log('⌨️ Shortcuts: 1/2/3=Rate, A=Audio, Esc=Exit');
