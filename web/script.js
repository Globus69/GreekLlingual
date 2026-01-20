// Data Definitions
const vocabulary = [
    { english: "Hello", greek: "Γεια σου", example_en: "Hello, how are you?", example_gr: "Γεια σου, πώς είσαι?" },
    { english: "Thank you", greek: "Ευχαριστώ", example_en: "Thank you very much!", example_gr: "Ευχαριστώ πολύ!" },
    { english: "Yes", greek: "Ναι", example_en: "Yes, I agree.", example_gr: "Ναι, συμφωνώ." },
    { english: "No", greek: "Όχι", example_en: "No, thank you.", example_gr: "Όχι, ευχαριστώ." },
    { english: "Water", greek: "Νερό", example_en: "Can I have some water?", example_gr: "Μπορώ να έχω λίγο νερό?" }
];

const phrases = [
    { eng: "Good morning", gr: "Καλημέρα (Kaliméra)" },
    { eng: "How are you?", gr: "Πώς είσαι; (Pós íse?)" },
    { eng: "Where is the beach?", gr: "Πού είναι η παραλία; (Poú íne i paralía?)" },
    { eng: "I would like a coffee", gr: "Θα ήθελα έναν καφέ (Tha íthela énan kafé)" },
    { eng: "Check please", gr: "Το λογαριασμό παρακαλώ (To logariasmó parakaló)" },
    { eng: "Excuse me", gr: "Με συγχωρείτε (Me synchoreíte)" }
];

const quizText = `Γεια σας! Σήμερα είναι μια όμορφη <u class="quiz-word" onclick="showMeaning('Day')">μέρα</u> στην <u class="quiz-word" onclick="showMeaning('City')">πόλη</u>. 
Ο <u class="quiz-word" onclick="showMeaning('Sun')">ήλιος</u> λάμπει και η <u class="quiz-word" onclick="showMeaning('Sea')">θάλασσα</u> είναι πολύ ήρεμη. 
Πολλοί <u class="quiz-word" onclick="showMeaning('People')">άνθρωποι</u> περπατούν στον <u class="quiz-word" onclick="showMeaning('Road')">δρόμο</u> και πηγαίνουν στα <u class="quiz-word" onclick="showMeaning('Shops')">μαγαζιά</u>.`;

const videos = [
    { title: "Lesson 1: Basics", icon: "▶" },
    { title: "Lesson 2: Greetings", icon: "▶" },
    { title: "Lesson 3: Numbers", icon: "▶" },
    { title: "Lesson 4: Shopping", icon: "▶" }
];

const books = [
    { title: "Grammar 101", icon: "📗" },
    { title: "1000 Verbs", icon: "📘" },
    { title: "Greek Myths", icon: "📙" }
];

const cyprusListening = [
    { eng: "The house is big", gr: "Το σπίτι είναι μεγάλο" },
    { eng: "Where is the bank?", gr: "Πού είναι η τράπεζα;" }
];

// State
let currentIndex = 0;
let isFlipped = false;
let currentView = 'login-view'; // Initial view

// DOM Elements
const views = document.querySelectorAll('.view');
const toast = document.getElementById('toast');
const toastMsg = document.getElementById('toast-msg');

// Initial Load
window.onload = () => {
    initModules();
    updateCardContent();
};

// Login Logic
function handleLogin() {
    const loginView = document.getElementById('login-view');
    const dashboardView = document.getElementById('dashboard-view');

    // Simulate loading/auth check
    const btn = document.querySelector('.login-btn');
    const originalText = btn.innerText;
    btn.innerText = "Signing in...";

    setTimeout(() => {
        loginView.style.opacity = '0';
        setTimeout(() => {
            loginView.classList.remove('active');
            dashboardView.classList.add('active');
            // Small delay for fade in
            requestAnimationFrame(() => {
                dashboardView.style.opacity = '1';
            });
            currentView = 'dashboard-view';
            btn.innerText = originalText;
        }, 500);
    }, 800);
}

// Initialization
function initModules() {
    // Phrases
    const phrasesList = document.getElementById('phrases-list');
    if (phrasesList) phrasesList.innerHTML = phrases.map(p => `
        <div class="phrase-item">
            <span class="phrase-en">${p.eng}</span>
            <span class="phrase-gr">${p.gr}</span>
        </div>
    `).join('');

    // Quiz
    const quizContent = document.getElementById('quiz-content');
    if (quizContent) quizContent.innerHTML = quizText;

    // Videos
    const videoGrid = document.getElementById('video-grid');
    if (videoGrid) videoGrid.innerHTML = videos.map(v => `
        <div class="grid-item" onclick="showPlaceholder('Playing Video...')">
            <div class="grid-icon">${v.icon}</div>
            <div class="grid-title">${v.title}</div>
        </div>
    `).join('');

    // Books
    const bookGrid = document.getElementById('book-grid');
    if (bookGrid) bookGrid.innerHTML = books.map(b => `
        <div class="grid-item" onclick="showPlaceholder('Opening Book...')">
            <div class="grid-icon">${b.icon}</div>
            <div class="grid-title">${b.title}</div>
        </div>
    `).join('');

    // Cyprus Listening
    const cyprusList = document.getElementById('cyprus-listening-list');
    if (cyprusList) cyprusList.innerHTML = cyprusListening.map(c => `
        <div class="phrase-item">
            <span class="phrase-en">${c.eng}</span>
            <div style="display:flex; align-items:center; gap:10px;">
                <span class="phrase-gr">${c.gr}</span>
                <span style="font-size:20px; cursor:pointer;" onclick="showPlaceholder('Playing Audio...')">▶</span>
            </div>
        </div>
    `).join('');
}

// Navigation
function openModule(moduleName) {
    let targetViewId = moduleName + '-view';
    if (moduleName === 'vokabeln') targetViewId = 'vokabeln-view';
    if (moduleName === 'cyprus-listening') targetViewId = 'cyprus-listening-view';

    const targetView = document.getElementById(targetViewId);
    if (targetView) {
        document.querySelector('.view.active').classList.remove('active');
        document.querySelector('.view.active').style.opacity = '0'; // Clean fade out

        targetView.classList.add('active');
        requestAnimationFrame(() => targetView.style.opacity = '1');

        currentView = targetViewId;

        if (moduleName === 'vokabeln') resetCard();
        window.scrollTo(0, 0);
    } else {
        showPlaceholder();
    }
}

function openDashboard() {
    const activeInfo = document.querySelector('.view.active');
    activeInfo.classList.remove('active');
    activeInfo.style.opacity = '0';

    const dash = document.getElementById('dashboard-view');
    dash.classList.add('active');
    requestAnimationFrame(() => dash.style.opacity = '1');
    currentView = 'dashboard-view';
}

// Actions
function startMagicMix() {
    showPlaceholder("✨ Preparing Magic Mix...");
}

function startLessonToday() {
    showPlaceholder("📅 Starting Today's Lesson...");
}

function startQuickLesson() {
    showPlaceholder("⚡️ Starting 20min Session...");
}

function startRepeat() {
    showPlaceholder("🔁 Loading Review Session...");
}

function showPlaceholder(msg = "Feature coming soon") {
    toastMsg.innerText = msg;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2000);
}

// Flashcard Logic
function updateCardContent() {
    const vocab = vocabulary[currentIndex];
    const wf = document.getElementById('word-front');
    if (wf) {
        wf.textContent = vocab.english;
        document.getElementById('example-front').textContent = vocab.example_en;
        document.getElementById('word-back').textContent = vocab.greek;
        document.getElementById('example-back').textContent = vocab.example_gr;
        document.getElementById('progress-text').textContent = `${currentIndex + 1} / ${vocabulary.length}`;

        document.getElementById('prev-btn').disabled = currentIndex === 0;
        document.getElementById('next-btn').disabled = currentIndex === vocabulary.length - 1;
    }
}

function flipCard() {
    const card = document.getElementById('flashcard');
    isFlipped = !isFlipped;
    if (isFlipped) card.classList.add('flipped');
    else card.classList.remove('flipped');
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
    if (isFlipped) {
        card.classList.remove('flipped');
        isFlipped = false;
    }
    setTimeout(updateCardContent, 300);
}

function resetCard() {
    currentIndex = 0;
    isFlipped = false;
    const card = document.getElementById('flashcard');
    if (card) card.classList.remove('flipped');
    updateCardContent();
}

function showMeaning(word) {
    alert(`Meaning: ${word}`);
}
