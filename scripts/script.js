// ========================================
// DATEN werden aus shared-data.js geladen
// ========================================
// allFlashcards, getDueCards(), getTodayDateString() sind verfügbar

// ========================================
// STATE & DOM ELEMENTE
// ========================================
let flashcards = []; // Wird basierend auf Modus gefiltert
let currentIndex = 0;
let isFlipped = false;
let isReviewMode = false;

const flashcard = document.getElementById('flashcard');
const englishWord = document.getElementById('englishWord');
const greekWord = document.getElementById('greekWord');
const audioFront = document.getElementById('audioFront');
const audioBack = document.getElementById('audioBack');
const answerInput = document.getElementById('answerInput');
const ratingButtons = document.querySelectorAll('.rating-btn');
const currentCardSpan = document.getElementById('currentCard');
const totalCardsSpan = document.getElementById('totalCards');
const pageHeader = document.getElementById('pageHeader');
const completionScreen = document.getElementById('completionScreen');
const backToDashboardBtn = document.getElementById('backToDashboard');

// ========================================
// INITIALISIERUNG
// ========================================
function init() {
    // URL-Parameter auslesen
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    // Modus prüfen und Karten filtern
    if (mode === 'review') {
        isReviewMode = true;
        flashcards = getDueCards();
        pageHeader.textContent = 'Due Cards Today – Let\'s review!';
    } else {
        flashcards = allFlashcards;
        pageHeader.textContent = 'Flashcards';
    }

    // Prüfen ob Karten vorhanden sind
    if (flashcards.length === 0) {
        showCompletionScreen();
        return;
    }

    // App initialisieren
    totalCardsSpan.textContent = flashcards.length;
    loadCard(currentIndex);
    attachEventListeners();
}

// ========================================
// EVENT LISTENERS
// ========================================
function attachEventListeners() {
    // Flip-Funktionalität bei Klick auf die Karte
    flashcard.addEventListener('click', (e) => {
        // Verhindere Flip bei Klick auf Buttons/Input
        if (e.target.closest('.audio-btn') ||
            e.target.closest('.rating-btn') ||
            e.target.closest('.answer-input')) {
            return;
        }

        if (!isFlipped) {
            flipCard();
        }
    });

    // Audio-Buttons
    audioFront.addEventListener('click', (e) => {
        e.stopPropagation();
        playAudio(flashcards[currentIndex].audioFront);
    });

    audioBack.addEventListener('click', (e) => {
        e.stopPropagation();
        playAudio(flashcards[currentIndex].audioBack);
    });

    // Rating-Buttons
    ratingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const rating = btn.dataset.rating;
            handleRating(rating);
        });
    });

    // Enter-Taste im Input
    answerInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            handleRating('enter');
        }
    });

    // Back to Dashboard Button
    backToDashboardBtn.addEventListener('click', () => {
        // Navigiere zurück zum Dashboard
        // Prüfe ob Dashboard in /web/ liegt oder im Root
        window.location.href = './web/index.html';
    });
}

// ========================================
// KARTE LADEN
// ========================================
function loadCard(index) {
    const card = flashcards[index];

    // Inhalte setzen
    englishWord.textContent = card.english;
    greekWord.textContent = card.greek;

    // Progress aktualisieren
    currentCardSpan.textContent = index + 1;

    // Input leeren und Flip-Status zurücksetzen
    answerInput.value = '';
    isFlipped = false;
    flashcard.classList.remove('flipped');
}

// ========================================
// FLIP-ANIMATION
// ========================================
function flipCard() {
    flashcard.classList.add('flipped');
    isFlipped = true;

    // Focus auf Input nach Flip
    setTimeout(() => {
        answerInput.focus();
    }, 300);
}

// ========================================
// AUDIO ABSPIELEN
// ========================================
function playAudio(audioFile) {
    // Platzhalter-Funktion für Audio
    // In Produktion: new Audio(audioFile).play();
    console.log(`Playing audio: ${audioFile}`);

    // Visuelles Feedback
    const btn = event.target;
    btn.style.transform = 'scale(0.9)';
    setTimeout(() => {
        btn.style.transform = '';
    }, 150);
}

// ========================================
// BEWERTUNG & NÄCHSTE KARTE
// ========================================
function handleRating(rating) {
    const card = flashcards[currentIndex];

    console.log(`Card rated: ${rating}`);
    console.log(`User answer: ${answerInput.value}`);
    console.log(`Card data:`, {
        english: card.english,
        ease: card.ease,
        interval: card.interval,
        dueDate: card.dueDate
    });

    // Hier könntest du SRS-Algorithmus implementieren
    // z.B. neue Ease/Interval berechnen und dueDate aktualisieren
    updateCardSchedule(card, rating);

    // Nächste Karte laden
    nextCard();
}

// ========================================
// SRS-SCHEDULE AKTUALISIEREN (Platzhalter)
// ========================================
function updateCardSchedule(card, rating) {
    // Beispiel-Logik für SRS-Update
    // In Produktion: API-Call oder localStorage-Update

    let multiplier = 1;
    switch (rating) {
        case 'good':
            multiplier = 1.2;
            break;
        case 'very-good':
            multiplier = 2.0;
            break;
        case 'easy':
            multiplier = 2.5;
            break;
        default:
            multiplier = 1.0;
    }

    // Neues Interval berechnen
    const newInterval = Math.round(card.interval * multiplier);

    // Neues dueDate berechnen
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + newInterval);
    const newDueDate = nextDue.toISOString().split('T')[0];

    console.log(`Updated schedule: interval ${card.interval} → ${newInterval}, dueDate → ${newDueDate}`);

    // In Produktion: Daten speichern
    // card.interval = newInterval;
    // card.dueDate = newDueDate;
}

// ========================================
// NÄCHSTE KARTE
// ========================================
function nextCard() {
    // Fade-out Animation
    flashcard.classList.add('fade-out');

    setTimeout(() => {
        // Prüfen ob weitere Karten vorhanden
        if (currentIndex + 1 >= flashcards.length) {
            // Letzte Karte erreicht
            if (isReviewMode) {
                // Im Review-Modus: Completion Screen zeigen
                showCompletionScreen();
            } else {
                // Normaler Modus: Von vorne beginnen
                currentIndex = 0;
                loadCard(currentIndex);
                flashcard.classList.remove('fade-out');
                flashcard.classList.add('fade-in');
                setTimeout(() => {
                    flashcard.classList.remove('fade-in');
                }, 400);
            }
        } else {
            // Nächste Karte laden
            currentIndex++;
            loadCard(currentIndex);

            // Fade-out entfernen und Fade-in starten
            flashcard.classList.remove('fade-out');
            flashcard.classList.add('fade-in');

            // Fade-in Klasse nach Animation entfernen
            setTimeout(() => {
                flashcard.classList.remove('fade-in');
            }, 400);
        }
    }, 400);
}

// ========================================
// COMPLETION SCREEN ANZEIGEN
// ========================================
function showCompletionScreen() {
    // Flashcard und Progress ausblenden
    flashcard.style.display = 'none';
    document.querySelector('.progress').style.display = 'none';

    // Completion Screen anzeigen
    completionScreen.style.display = 'flex';

    // Optional: Nach 3 Sekunden automatisch zum Dashboard
    // setTimeout(() => {
    //     window.location.href = './index.html';
    // }, 3000);
}

// ========================================
// APP STARTEN
// ========================================
init();
