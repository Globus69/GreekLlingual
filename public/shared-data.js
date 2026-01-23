// ========================================
// SHARED FLASHCARD DATA
// ========================================
// Dieses Modul wird von Dashboard und Flashcard-Seite verwendet
// um konsistente Daten zu haben

const allFlashcards = [
    {
        english: 'Hello',
        greek: 'Γεια σου',
        contextEn: 'A common greeting',
        contextGr: 'Μια κοινή χαιρετισμός',
        audioFront: 'hello-en.mp3',
        audioBack: 'hello-gr.mp3',
        dueDate: '2026-01-22', // Heute (due)
        ease: 2.5,
        interval: 1
    },
    {
        english: 'Thank you',
        greek: 'Ευχαριστώ',
        contextEn: 'Express gratitude',
        contextGr: 'Εκφράζω ευγνωμοσύνη',
        audioFront: 'thank-you-en.mp3',
        audioBack: 'thank-you-gr.mp3',
        dueDate: '2026-01-20', // Gestern (due)
        ease: 2.0, // Weak word (< 2.3)
        interval: 2
    },
    {
        english: 'Goodbye',
        greek: 'Αντίο',
        contextEn: 'A farewell',
        contextGr: 'Ένας αποχαιρετισμός',
        audioFront: 'goodbye-en.mp3',
        audioBack: 'goodbye-gr.mp3',
        dueDate: '2026-01-25', // Zukunft (nicht due)
        ease: 2.8,
        interval: 5
    },
    {
        english: 'Please',
        greek: 'Παρακαλώ',
        contextEn: 'A polite request',
        contextGr: 'Μια ευγενική παράκληση',
        audioFront: 'please-en.mp3',
        audioBack: 'please-gr.mp3',
        dueDate: '2026-01-22', // Heute (due)
        ease: 2.1, // Weak word (< 2.3)
        interval: 3
    },
    {
        english: 'Water',
        greek: 'Νερό',
        contextEn: 'Essential liquid',
        contextGr: 'Απαραίτητο υγρό',
        audioFront: 'water-en.mp3',
        audioBack: 'water-gr.mp3',
        dueDate: '2026-01-21', // Gestern (due)
        ease: 2.6,
        interval: 2
    },
    {
        english: 'Good morning',
        greek: 'Καλημέρα',
        contextEn: 'Morning greeting',
        contextGr: 'Πρωινός χαιρετισμός',
        audioFront: 'goodmorning-en.mp3',
        audioBack: 'goodmorning-gr.mp3',
        dueDate: '2026-01-22', // Heute (due)
        ease: 1.9, // Weak word (< 2.3)
        interval: 1
    }
];

// ========================================
// HILFSFUNKTION: Heutiges Datum als String
// ========================================
function getTodayDateString() {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// ========================================
// DUE CARDS ZÄHLEN
// ========================================
function getDueCardsCount() {
    const today = getTodayDateString();
    return allFlashcards.filter(card => card.dueDate <= today).length;
}

// ========================================
// DUE CARDS FILTERN
// ========================================
function getDueCards() {
    const today = getTodayDateString();
    return allFlashcards.filter(card => card.dueDate <= today);
}
