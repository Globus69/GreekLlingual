// Supabase Configuration (Using window.supabase global initialized in HTML)
const supabaseUrl = 'https://YOUR_PROJECT_URL.supabase.co'; // Should be replaced or taken from env
const supabaseKey = 'YOUR_ANON_KEY';
const supabase = window.supabase ? window.supabase.createClient(supabaseUrl, supabaseKey) : null;

// State
let vocabulary = [];
let currentIndex = 0;
let isFlipped = false;
const STUDENT_ID = 'demo-student-id'; // Fixed for prototype

// Initial Load
window.onload = () => {
    initApp();
};

async function initApp() {
    await fetchVocabulary();
    initModules();
    updateDateTime();
    setInterval(updateDateTime, 1000);

    // Fade out login
    setTimeout(() => {
        const overlay = document.getElementById('login-overlay');
        if (overlay) {
            overlay.style.opacity = '0';
            setTimeout(() => overlay.remove(), 500);
        }
    }, 800);
}

// Data Fetching
async function fetchVocabulary() {
    if (!supabase) return;

    const { data, error } = await supabase
        .from('learning_items')
        .select(`
            *,
            student_progress!left(*)
        `)
        .eq('type', 'vocabulary')
        .order('next_review', { foreignTable: 'student_progress', ascending: true, nullsFirst: true })
        .limit(20);

    if (error) {
        console.error("Error fetching vocabs:", error);
    } else {
        vocabulary = data;
        updateCardContent();
        updateProgressUI();
    }
}

// SRS Rating Logic
async function rateVocab(multiplier) {
    if (!supabase || !vocabulary[currentIndex]) return;

    const item = vocabulary[currentIndex];
    const progress = item.student_progress?.[0] || {
        interval_days: 1.0,
        ease_factor: 2.5,
        attempts: 0,
        correct_count: 0
    };

    let newInterval = progress.interval_days;
    let newEase = progress.ease_factor;

    if (multiplier === 1) { // Schwer
        newInterval = 1; // Reset
    } else {
        newInterval = Math.round(progress.interval_days * multiplier);
        if (multiplier > 2.5) newEase += 0.1;
    }

    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + newInterval);

    const { error } = await supabase
        .from('student_progress')
        .upsert({
            item_id: item.id,
            student_id: STUDENT_ID,
            attempts: progress.attempts + 1,
            correct_count: multiplier > 1 ? progress.correct_count + 1 : progress.correct_count,
            last_attempt: new Date().toISOString(),
            next_review: nextReview.toISOString(),
            interval_days: newInterval,
            ease_factor: newEase
        });

    if (error) {
        showPlaceholder("❌ Update failed");
    } else {
        showPlaceholder(`✅ Next review in ${newInterval} days`);
        setTimeout(() => nextCard(), 1000);
    }
}

function updateProgressUI() {
    const prog = document.getElementById('vocab-progress');
    const dueCount = vocabulary.filter(v => {
        const next = v.student_progress?.[0]?.next_review;
        return !next || new Date(next) <= new Date();
    }).length;

    if (prog) prog.innerText = `${dueCount} fällig von ${vocabulary.length}`;
}

// Flashcard Logic
function updateCardContent() {
    if (vocabulary.length === 0) return;

    const vocab = vocabulary[currentIndex];
    const wf = document.getElementById('word-front');
    if (wf) {
        wf.textContent = vocab.english;
        document.getElementById('example-front').textContent = vocab.example_en || '';
        document.getElementById('word-back').textContent = vocab.greek;
        document.getElementById('example-back').textContent = vocab.example_gr || '';

        document.getElementById('prev-btn').disabled = currentIndex === 0;
        document.getElementById('next-btn').disabled = currentIndex === vocabulary.length - 1;
    }
}

// Navigation & Generic UI
function openView(id) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(id).classList.add('active');
}

function openDashboard() {
    openView('dashboard-view');
}

function flipCard() {
    const card = document.getElementById('flashcard');
    isFlipped = !isFlipped;
    card.classList.toggle('flipped', isFlipped);
}

function nextCard() {
    if (currentIndex < vocabulary.length - 1) {
        currentIndex++;
        resetForNavigation();
    }
}

function prevCard() {
    if (currentIndex > 0) {
        currentIndex--;
        resetForNavigation();
    }
}

function resetForNavigation() {
    const card = document.getElementById('flashcard');
    card.classList.remove('flipped');
    isFlipped = false;
    setTimeout(updateCardContent, 300);
}

function updateDateTime() {
    const now = new Date();
    const dt = document.getElementById('datetime');
    if (dt) dt.innerText = now.toLocaleString('de-DE');
}

function showPlaceholder(msg) {
    const toast = document.getElementById('toast');
    const tMsg = document.getElementById('toast-msg');
    tMsg.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Phrasen & Quiz (Dummy/Static for now)
function initModules() {
    const q = document.getElementById('quiz-content');
    if (q) q.innerHTML = "Lade Text...";
}
