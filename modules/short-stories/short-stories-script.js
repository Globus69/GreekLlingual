// ========================================
// SHORT STORIES – Supabase & Audio (MP3)
// ========================================
const SUPABASE_URL = 'https://bzdzqmnxycnudflcnmzj.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_uT0wv5-tv95ETP0u16h8zg_Ni3WqAIo';

let supabaseClient = null;
let currentUser = null;
let useSupabase = false;
let audioEl = null;

function initializeSupabase() {
    try {
        let SupabaseLibrary = null;
        if (typeof window.supabase !== 'undefined') {
            if (window.supabase.createClient) SupabaseLibrary = window.supabase;
            else if (window.supabase.default?.createClient) SupabaseLibrary = window.supabase.default;
        }
        if (!SupabaseLibrary && typeof supabase !== 'undefined') {
            if (supabase.createClient) SupabaseLibrary = supabase;
            else if (supabase.default?.createClient) SupabaseLibrary = supabase.default;
        }
        if (SupabaseLibrary?.createClient) {
            supabaseClient = SupabaseLibrary.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            useSupabase = true;
            return true;
        }
        return false;
    } catch (err) {
        console.error('Supabase init error:', err);
        return false;
    }
}

window.addEventListener('supabase-loaded', () => { if (!useSupabase) initializeSupabase(); });

let initAttempts = 0;
function tryInitSupabase() {
    initAttempts++;
    if (initializeSupabase()) return true;
    if (initAttempts < 10) setTimeout(tryInitSupabase, 200);
    return false;
}
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(tryInitSupabase, 100));
} else {
    setTimeout(tryInitSupabase, 100);
}

// ========================================
// DATA
// ========================================
const SECTION_SEP = '|||SECTION|||';
const N_SECTIONS = 5;
let stories = [];
let currentIndex = 0;
let storiesReviewed = 0;

const LOREM = [
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor.',
    'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip.',
    'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.',
    'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
    'Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium.',
];
const FALLBACK_STORIES = [
    {
        id: 'f1',
        greek_text: LOREM.join(SECTION_SEP),
        english_text: LOREM.join(SECTION_SEP),
        audio_url: null,
    },
];

// ========================================
// DOM
// ========================================
const phraseCard = document.getElementById('phraseCard');
const greekScrollContainer = document.getElementById('greekScrollContainer');
const englishScrollContainer = document.getElementById('englishScrollContainer');
const audioBtn = document.getElementById('audioBtn');
const cancelBtn = document.getElementById('cancelBtn');
const restartBtn = document.getElementById('restartBtn');
const ratingButtons = document.querySelectorAll('.rating-btn');
const progressFill = document.getElementById('progressFill');
const completionScreen = document.getElementById('completionScreen');
const phrasesReviewedSpan = document.getElementById('phrasesReviewed');
const mainCardArea = document.querySelector('.main-card-area');

let currentSectionIndex = 0;
let sectionCount = 1;
let greekSectionEls = [];
let englishSectionEls = [];
const sectionRatingByKey = {};

// ========================================
// LOAD FROM SUPABASE
// ========================================
async function loadStoriesFromSupabase() {
    if (!useSupabase || !supabaseClient) {
        await new Promise(r => setTimeout(r, 300));
        if (!useSupabase || !supabaseClient) {
            console.log('Using fallback Short Stories');
            return shuffle([...FALLBACK_STORIES]);
        }
    }

    try {
        const { data, error } = await supabaseClient
            .from('short_stories')
            .select('id, greek_text, english_text, audio_url, title')
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) {
            if (error.message?.includes('does not exist') || error.code === '42P01') {
                console.warn('short_stories table missing. Run supabase/insert_test_short_stories.sql');
            }
            return shuffle([...FALLBACK_STORIES]);
        }
        if (!data?.length) return shuffle([...FALLBACK_STORIES]);
        return shuffle(data);
    } catch (e) {
        console.warn('Short Stories fetch error:', e);
        return shuffle([...FALLBACK_STORIES]);
    }
}

function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ========================================
// INIT
// ========================================
async function init() {
    if (!useSupabase) {
        await new Promise(r => setTimeout(r, 500));
        initializeSupabase();
        await new Promise(r => setTimeout(r, 300));
    }

    if (useSupabase && supabaseClient) {
        try {
            const { data: { user } } = await supabaseClient.auth.getUser();
            currentUser = user || null;
        } catch (_) {
            currentUser = null;
        }
    }

    attachListeners();

    stories = await loadStoriesFromSupabase();
    if (stories.length === 0) {
        showNoStories();
        return;
    }

    loadStory(currentIndex);
    updateProgress();
}

function showNoStories() {
    if (mainCardArea) mainCardArea.style.display = 'none';
    const pw = document.querySelector('.progress-wrapper');
    if (pw) pw.style.display = 'none';
    const el = document.createElement('div');
    el.className = 'completion-screen active';
    el.innerHTML = `
        <div class="completion-content">
            <div class="completion-icon">📚</div>
            <h2 class="completion-title">Keine Short Stories</h2>
            <p class="completion-text">Führe supabase/insert_test_short_stories.sql aus.</p>
            <button class="back-to-dashboard-btn" id="noStoriesBack">Back to Dashboard</button>
        </div>
    `;
    document.querySelector('.app-container').appendChild(el);
    document.getElementById('noStoriesBack').addEventListener('click', () => { window.location.href = '/dashboard'; });
}

// ========================================
// SECTIONS (|||SECTION|||, dann \n\n oder \n)
// ========================================
function splitSections(text) {
    if (!text || !String(text).trim()) return ['—'];
    const s = String(text).trim();
    
    // Prüfe explizit auf das Trennzeichen
    if (s.includes(SECTION_SEP)) {
        const parts = s.split(SECTION_SEP).map(p => p.trim()).filter(Boolean);
        if (parts.length > 0) {
            return parts;
        }
    }
    
    // Fallback: Versuche andere Trennzeichen
    let parts = s.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) parts = s.split(/\n/).map(p => p.trim()).filter(Boolean);
    if (parts.length === 0) {
        return [s];
    }
    return parts;
}

function buildSectionDom(container, sections, className) {
    container.innerHTML = '';
    const els = [];
    sections.forEach((txt) => {
        const div = document.createElement('div');
        div.className = className || 'frame-section';
        div.textContent = txt;
        container.appendChild(div);
        els.push(div);
    });
    return els;
}

// ========================================
// LOAD STORY (upper: Greek, lower: English), section scroll
// ========================================
function loadStory(index) {
    const s = stories[index] || {};
    const greekRaw = s.greek_text || '—';
    const englishRaw = s.english_text || '—';
    
    const greekParts = splitSections(greekRaw);
    const englishParts = splitSections(englishRaw);

    // Verwende die tatsächliche Anzahl der Abschnitte
    sectionCount = Math.max(greekParts.length, englishParts.length, 1);
    
    const greekSections = [];
    const englishSections = [];
    for (let i = 0; i < sectionCount; i++) {
        greekSections.push((greekParts[i] ?? '').trim() || '—');
        englishSections.push((englishParts[i] ?? '').trim() || '—');
    }

    greekSectionEls = buildSectionDom(greekScrollContainer, greekSections, 'frame-section');
    englishSectionEls = buildSectionDom(englishScrollContainer, englishSections, 'frame-section');

    currentSectionIndex = 0;

    const en = document.querySelector('.english-translation-container');
    if (en) en.classList.add('blurred');

    // Warte auf das Rendering der DOM-Elemente, bevor gescrollt wird
    // Doppeltes requestAnimationFrame stellt sicher, dass Layout und Paint abgeschlossen sind
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            scrollToSection(0);
            // Aktualisiere die Anzeige nach dem Rendering
            setTimeout(() => {
                updateSectionCountDisplay();
            }, 100);
        });
    });
    
    // Initiale Anzeige (wird später aktualisiert)
    updateSectionCountDisplay();
    updateRatingDisplay();
    updateProgress();
}

function scrollToSection(i) {
    currentSectionIndex = Math.max(0, Math.min(i, sectionCount - 1));
    
    // Beim initialen Laden: Scrolle zum Anfang und zeige nur vollständig sichtbare Abschnitte
    const scrollOne = (container, els) => {
        if (!container || !els || els.length === 0) return;
        
        const performScroll = () => {
            const containerHeight = container.clientHeight;
            
            // Wenn Container noch keine Größe hat, versuche es erneut
            if (containerHeight === 0) {
                setTimeout(performScroll, 50);
                return;
            }
            
            // Beim initialen Laden (Index 0): Scrolle zum Anfang
            if (currentSectionIndex === 0) {
                container.scrollTo({ top: 0, behavior: 'smooth' });
                
                // Nach dem Scrollen: Prüfe welche Abschnitte vollständig sichtbar sind
                setTimeout(() => {
                    const visible = getFullyVisibleSections(container, els);
                    if (visible.length > 0) {
                        // Aktualisiere currentSectionIndex basierend auf dem ersten sichtbaren Abschnitt
                        // Aber nur wenn wir beim initialen Laden sind
                    }
                }, 300);
            } else {
                // Für andere Abschnitte: Verwende die normale Scroll-Logik
                const el = els[currentSectionIndex];
                if (!el) return;
                
                const elementTop = el.offsetTop;
                const elementHeight = el.offsetHeight;
                const elementBottom = elementTop + elementHeight;
                const currentScrollTop = container.scrollTop;
                const visibleTop = currentScrollTop;
                const visibleBottom = currentScrollTop + containerHeight;
                
                // Prüfe, ob der Abschnitt vollständig sichtbar ist
                const isFullyVisible = elementTop >= visibleTop && elementBottom <= visibleBottom;
                
                if (!isFullyVisible) {
                    let targetScroll;
                    if (elementHeight > containerHeight) {
                        // Abschnitt ist größer als Container, zeige den Anfang
                        targetScroll = elementTop;
                    } else {
                        // Abschnitt passt in Container
                        if (elementTop < visibleTop) {
                            // Abschnitt ist oben abgeschnitten
                            targetScroll = elementTop;
                        } else if (elementBottom > visibleBottom) {
                            // Abschnitt ist unten abgeschnitten
                            targetScroll = elementBottom - containerHeight;
                        } else {
                            targetScroll = currentScrollTop;
                        }
                    }
                    container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
                }
            }
        };
        
        performScroll();
    };
    
    // Führe das Scrolling aus, nachdem das DOM aktualisiert wurde
    requestAnimationFrame(() => {
        scrollOne(greekScrollContainer, greekSectionEls);
        scrollOne(englishScrollContainer, englishSectionEls);
    });
    
    // Nach dem Scrollen: Aktualisiere currentSectionIndex basierend auf vollständig sichtbaren Abschnitten
    setTimeout(() => {
        const greekVisible = getFullyVisibleSections(greekScrollContainer, greekSectionEls);
        const englishVisible = getFullyVisibleSections(englishScrollContainer, englishSectionEls);
        
        if (greekVisible.length > 0 || englishVisible.length > 0) {
            // Verwende den ersten vollständig sichtbaren Abschnitt
            const firstVisible = Math.min(
                greekVisible.length > 0 ? greekVisible[0] : sectionCount,
                englishVisible.length > 0 ? englishVisible[0] : sectionCount
            );
            currentSectionIndex = Math.max(0, Math.min(sectionCount - 1, firstVisible));
        }
        
        updateArrowDisabled();
        updateSectionCountDisplay();
        updateRatingDisplay();
        updateProgress();
    }, 350);
}

function updateArrowDisabled() {
    const up = document.querySelectorAll('.scroll-arrow.scroll-up');
    const down = document.querySelectorAll('.scroll-arrow.scroll-down');
    
    // Prüfe Scroll-Positionen beider Container
    const greekScrollTop = greekScrollContainer?.scrollTop || 0;
    const greekScrollHeight = greekScrollContainer?.scrollHeight || 0;
    const greekContainerHeight = greekScrollContainer?.clientHeight || 0;
    const greekMaxScroll = greekScrollHeight - greekContainerHeight;
    const greekAtTop = greekScrollTop <= 1;
    const greekAtBottom = greekScrollTop >= greekMaxScroll - 1;
    
    const englishScrollTop = englishScrollContainer?.scrollTop || 0;
    const englishScrollHeight = englishScrollContainer?.scrollHeight || 0;
    const englishContainerHeight = englishScrollContainer?.clientHeight || 0;
    const englishMaxScroll = englishScrollHeight - englishContainerHeight;
    const englishAtTop = englishScrollTop <= 1;
    const englishAtBottom = englishScrollTop >= englishMaxScroll - 1;
    
    // Prüfe zusätzlich, ob der letzte Abschnitt vollständig sichtbar ist
    const greekVisible = getFullyVisibleSections(greekScrollContainer, greekSectionEls);
    const englishVisible = getFullyVisibleSections(englishScrollContainer, englishSectionEls);
    const lastSectionIndex = sectionCount - 1;
    const greekLastVisible = greekVisible.includes(lastSectionIndex);
    const englishLastVisible = englishVisible.includes(lastSectionIndex);
    const lastSectionFullyVisible = greekLastVisible && englishLastVisible;
    
    // Up-Button ist disabled, wenn beide Container am Anfang sind
    const canScrollUp = !greekAtTop || !englishAtTop;
    // Down-Button ist disabled, wenn beide Container am Ende sind UND der letzte Abschnitt vollständig sichtbar ist
    const canScrollDown = (!greekAtBottom || !englishAtBottom) && !lastSectionFullyVisible;
    
    up.forEach((btn) => { btn.disabled = sectionCount <= 1 || !canScrollUp; });
    down.forEach((btn) => { btn.disabled = sectionCount <= 1 || !canScrollDown; });
    
    // Rating-Buttons nur aktivieren, wenn der letzte Abschnitt vollständig sichtbar ist
    const isLastSection = sectionCount <= 1 || lastSectionFullyVisible;
    ratingButtons.forEach((btn) => { 
        btn.disabled = !isLastSection; 
    });
}

function updateSectionCountDisplay() {
    const totalEl = document.getElementById('sectionCount');
    const currentEl = document.getElementById('sectionCurrent');
    
    // y = Gesamtanzahl der Abschnitte (konstant)
    if (totalEl) totalEl.textContent = String(Math.max(1, sectionCount));
    
    // Prüfe welche Abschnitte vollständig sichtbar sind
    const greekVisible = getFullyVisibleSections(greekScrollContainer, greekSectionEls);
    const englishVisible = getFullyVisibleSections(englishScrollContainer, englishSectionEls);
    
    // x = Anzahl der vollständig sichtbaren Abschnitte (dynamisch)
    let visibleCount = 0;
    
    const lastSectionIndex = sectionCount - 1;
    
    // Prüfe, ob wir am Ende des Scrolls sind
    const greekScrollTop = greekScrollContainer?.scrollTop || 0;
    const greekScrollHeight = greekScrollContainer?.scrollHeight || 0;
    const greekContainerHeight = greekScrollContainer?.clientHeight || 0;
    const greekMaxScroll = greekScrollHeight - greekContainerHeight;
    const greekAtBottom = greekScrollTop >= greekMaxScroll - 5;
    
    const englishScrollTop = englishScrollContainer?.scrollTop || 0;
    const englishScrollHeight = englishScrollContainer?.scrollHeight || 0;
    const englishContainerHeight = englishScrollContainer?.clientHeight || 0;
    const englishMaxScroll = englishScrollHeight - englishContainerHeight;
    const englishAtBottom = englishScrollTop >= englishMaxScroll - 5;
    
    // Prüfe ZUERST, ob der letzte Abschnitt sichtbar ist ODER ob wir am Ende sind
    // Wenn ja, dann x = y (alle Abschnitte wurden durchgescrollt)
    const lastInGreek = greekVisible.includes(lastSectionIndex);
    const lastInEnglish = englishVisible.includes(lastSectionIndex);
    const bothAtBottom = greekAtBottom && englishAtBottom;
    
    // Wenn der letzte Abschnitt in beiden Containern sichtbar ist ODER beide Container am Ende sind
    if ((lastInGreek && lastInEnglish) || (bothAtBottom && lastSectionIndex >= 0)) {
        visibleCount = sectionCount;
    } else {
        // Finde die gemeinsamen sichtbaren Abschnitte in beiden Containern
        const commonVisible = [];
        for (let i = 0; i < sectionCount; i++) {
            if (greekVisible.includes(i) && englishVisible.includes(i)) {
                commonVisible.push(i);
            }
        }
        
        if (commonVisible.length > 0) {
            // Sortiere die gemeinsamen sichtbaren Abschnitte
            commonVisible.sort((a, b) => a - b);
            
            // Finde die höchste Abschnittsnummer, die vollständig sichtbar ist
            const maxVisibleIndex = commonVisible[commonVisible.length - 1];
            // x = höchste sichtbare Abschnittsnummer + 1
            // Dies zeigt, wie viele Abschnitte bis zu diesem Punkt gesehen wurden
            visibleCount = maxVisibleIndex + 1;
            
            // Wenn der letzte Abschnitt in einem der Container sichtbar ist, setze auf sectionCount
            if (maxVisibleIndex === lastSectionIndex || lastInGreek || lastInEnglish) {
                visibleCount = sectionCount;
            }
        } else {
            // Fallback: Wenn keine gemeinsamen Abschnitte gefunden wurden, 
            // verwende die höchste Nummer aus einem der Container
            if (greekVisible.length > 0) {
                const maxGreek = Math.max(...greekVisible);
                visibleCount = maxGreek + 1;
                if (maxGreek === lastSectionIndex) {
                    visibleCount = sectionCount;
                }
            } else if (englishVisible.length > 0) {
                const maxEnglish = Math.max(...englishVisible);
                visibleCount = maxEnglish + 1;
                if (maxEnglish === lastSectionIndex) {
                    visibleCount = sectionCount;
                }
            } else {
                visibleCount = 1;
            }
        }
    }
    
    // Stelle sicher, dass mindestens 1 angezeigt wird und nicht mehr als die Gesamtanzahl
    if (currentEl) {
        currentEl.textContent = String(Math.max(1, Math.min(visibleCount, sectionCount)));
    }
}

function getSectionRatingKey() {
    return `${currentIndex}-${currentSectionIndex}`;
}

function updateRatingDisplay() {
    const el = document.getElementById('sectionRatingValue');
    if (!el) return;
    const key = getSectionRatingKey();
    el.textContent = sectionRatingByKey[key] ?? 'good';
    
    // Prüfe, ob der letzte Abschnitt sichtbar ist
    const ratingDisplay = document.querySelector('.section-rating-display');
    if (ratingDisplay) {
        const lastSectionIndex = sectionCount - 1;
        const greekVisible = getFullyVisibleSections(greekScrollContainer, greekSectionEls);
        const englishVisible = getFullyVisibleSections(englishScrollContainer, englishSectionEls);
        
        const lastInGreek = greekVisible.includes(lastSectionIndex);
        const lastInEnglish = englishVisible.includes(lastSectionIndex);
        const isLastSectionVisible = lastInGreek && lastInEnglish;
        
        // Prüfe auch, ob wir am Ende sind
        const greekScrollTop = greekScrollContainer?.scrollTop || 0;
        const greekScrollHeight = greekScrollContainer?.scrollHeight || 0;
        const greekContainerHeight = greekScrollContainer?.clientHeight || 0;
        const greekMaxScroll = greekScrollHeight - greekContainerHeight;
        const greekAtBottom = greekScrollTop >= greekMaxScroll - 10;
        
        const englishScrollTop = englishScrollContainer?.scrollTop || 0;
        const englishScrollHeight = englishScrollContainer?.scrollHeight || 0;
        const englishContainerHeight = englishScrollContainer?.clientHeight || 0;
        const englishMaxScroll = englishScrollHeight - englishContainerHeight;
        const englishAtBottom = englishScrollTop >= englishMaxScroll - 10;
        
        const bothAtBottom = greekAtBottom && englishAtBottom;
        
        if (isLastSectionVisible || (bothAtBottom && lastSectionIndex >= 0)) {
            ratingDisplay.classList.add('last-section');
        } else {
            ratingDisplay.classList.remove('last-section');
        }
    }
}

// Prüft, welche Abschnitte vollständig sichtbar sind
function getFullyVisibleSections(container, els) {
    if (!container || !els || els.length === 0) return [];
    
    const containerHeight = container.clientHeight;
    const currentScrollTop = container.scrollTop;
    const visibleTop = currentScrollTop;
    const visibleBottom = currentScrollTop + containerHeight;
    const maxScroll = container.scrollHeight - containerHeight;
    const isAtBottom = currentScrollTop >= maxScroll - 10; // 10px Toleranz für "am Ende"
    
    const fullyVisible = [];
    
    els.forEach((el, index) => {
        // Verwende offsetTop für die Position relativ zum Container
        const elementTop = el.offsetTop;
        const elementHeight = el.offsetHeight;
        const elementBottom = elementTop + elementHeight;
        
        const isLastSection = index === els.length - 1;
        
        // Abschnitt ist vollständig sichtbar, wenn er komplett im sichtbaren Bereich liegt
        // Mit einem Toleranzbereich (5px) für Rundungsfehler
        const isFullyVisible = elementTop >= visibleTop - 5 && elementBottom <= visibleBottom + 5;
        
        if (isFullyVisible) {
            fullyVisible.push(index);
        } else if (isLastSection && isAtBottom) {
            // Spezialfall für den letzten Abschnitt: Wenn wir am Ende sind,
            // betrachte ihn als vollständig sichtbar, wenn er teilweise sichtbar ist
            const isPartiallyVisible = elementTop < visibleBottom && elementBottom > visibleTop;
            
            if (isPartiallyVisible) {
                // Prüfe, wie viel vom Abschnitt sichtbar ist
                const visibleHeight = Math.min(elementBottom, visibleBottom) - Math.max(elementTop, visibleTop);
                const visibilityRatio = elementHeight > 0 ? visibleHeight / elementHeight : 0;
                
                // Wenn mehr als 70% des Abschnitts sichtbar sind ODER wir wirklich am Ende sind,
                // betrachte ihn als vollständig sichtbar
                if (visibilityRatio > 0.7 || currentScrollTop >= maxScroll - 2) {
                    fullyVisible.push(index);
                }
            }
        }
    });
    
    return fullyVisible;
}

function scrollSectionUp() {
    // Scrollt den gesamten sichtbaren Bereich nach unten (zeigt vorherige Abschnitte)
    const scrollOne = (container, els) => {
        if (!container || !els || els.length === 0) return;
        const containerHeight = container.clientHeight;
        const currentScrollTop = container.scrollTop;
        const newScrollTop = Math.max(0, currentScrollTop - containerHeight);
        
        container.scrollTo({ top: newScrollTop, behavior: 'smooth' });
    };
    
    scrollOne(greekScrollContainer, greekSectionEls);
    scrollOne(englishScrollContainer, englishSectionEls);
    
    // Nach dem Scrollen: Stelle sicher, dass keine Abschnitte abgeschnitten werden
    setTimeout(() => {
        const adjustScroll = (container, els) => {
            if (!container || !els || els.length === 0) return;
            
            const containerHeight = container.clientHeight;
            const currentScrollTop = container.scrollTop;
            const visibleTop = currentScrollTop;
            const visibleBottom = currentScrollTop + containerHeight;
            
            // Finde den ersten teilweise sichtbaren Abschnitt oben
            for (let i = 0; i < els.length; i++) {
                const el = els[i];
                const elementTop = el.offsetTop;
                const elementBottom = elementTop + el.offsetHeight;
                
                // Wenn Abschnitt oben abgeschnitten ist, scrolle zu seinem Anfang
                if (elementTop < visibleTop && elementBottom > visibleTop) {
                    container.scrollTo({ top: elementTop, behavior: 'smooth' });
                    break;
                }
            }
        };
        
        adjustScroll(greekScrollContainer, greekSectionEls);
        adjustScroll(englishScrollContainer, englishSectionEls);
        
        // Prüfe welche Abschnitte vollständig sichtbar sind
        setTimeout(() => {
            const greekVisible = getFullyVisibleSections(greekScrollContainer, greekSectionEls);
            const englishVisible = getFullyVisibleSections(englishScrollContainer, englishSectionEls);
            
            // Verwende den ersten vollständig sichtbaren Abschnitt
            if (greekVisible.length > 0 || englishVisible.length > 0) {
                const firstVisible = Math.min(
                    greekVisible.length > 0 ? greekVisible[0] : sectionCount,
                    englishVisible.length > 0 ? englishVisible[0] : sectionCount
                );
                currentSectionIndex = Math.max(0, firstVisible);
            }
            
            updateArrowDisabled();
            updateSectionCountDisplay();
            updateRatingDisplay();
            updateProgress();
        }, 300);
    }, 100);
}

function scrollSectionDown() {
    // Scrollt den gesamten sichtbaren Bereich nach oben (zeigt nächste Abschnitte)
    const scrollOne = (container, els) => {
        if (!container || !els || els.length === 0) return;
        const containerHeight = container.clientHeight;
        const currentScrollTop = container.scrollTop;
        const maxScroll = container.scrollHeight - containerHeight;
        
        // Prüfe, ob wir bereits am Ende sind
        if (currentScrollTop >= maxScroll - 1) {
            // Am Ende: Stelle sicher, dass der letzte Abschnitt vollständig sichtbar ist
            const lastEl = els[els.length - 1];
            if (lastEl) {
                const lastElementTop = lastEl.offsetTop;
                const lastElementBottom = lastElementTop + lastEl.offsetHeight;
                const targetScroll = lastElementBottom - containerHeight;
                container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
                return;
            }
        }
        
        const newScrollTop = Math.min(maxScroll, currentScrollTop + containerHeight);
        container.scrollTo({ top: newScrollTop, behavior: 'smooth' });
    };
    
    scrollOne(greekScrollContainer, greekSectionEls);
    scrollOne(englishScrollContainer, englishSectionEls);
    
    // Nach dem Scrollen: Stelle sicher, dass keine Abschnitte abgeschnitten werden
    setTimeout(() => {
        const adjustScroll = (container, els) => {
            if (!container || !els || els.length === 0) return;
            
            const containerHeight = container.clientHeight;
            const currentScrollTop = container.scrollTop;
            const maxScroll = container.scrollHeight - containerHeight;
            const visibleTop = currentScrollTop;
            const visibleBottom = currentScrollTop + containerHeight;
            
            // Prüfe, ob wir am Ende sind
            const isAtBottom = currentScrollTop >= maxScroll - 2; // 2px Toleranz
            
            if (isAtBottom) {
                // Am Ende: Stelle sicher, dass der letzte Abschnitt vollständig sichtbar ist
                const lastEl = els[els.length - 1];
                if (lastEl) {
                    const lastElementTop = lastEl.offsetTop;
                    const lastElementBottom = lastElementTop + lastEl.offsetHeight;
                    
                    // Wenn der letzte Abschnitt unten abgeschnitten ist, scrolle so, dass er vollständig sichtbar ist
                    if (lastElementBottom > visibleBottom + 2) {
                        const targetScroll = lastElementBottom - containerHeight;
                        container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
                        return true; // Anpassung wurde vorgenommen
                    }
                }
                return false; // Keine Anpassung nötig
            }
            
            // Finde den ersten teilweise sichtbaren Abschnitt oben
            for (let i = 0; i < els.length; i++) {
                const el = els[i];
                const elementTop = el.offsetTop;
                const elementBottom = elementTop + el.offsetHeight;
                
                // Wenn Abschnitt oben abgeschnitten ist, scrolle zu seinem Anfang
                if (elementTop < visibleTop - 2 && elementBottom > visibleTop + 2) {
                    container.scrollTo({ top: elementTop, behavior: 'smooth' });
                    return true; // Anpassung wurde vorgenommen
                }
            }
            
            return false; // Keine Anpassung nötig
        };
        
        const greekAdjusted = adjustScroll(greekScrollContainer, greekSectionEls);
        const englishAdjusted = adjustScroll(englishScrollContainer, englishSectionEls);
        
        // Warte länger, wenn Anpassungen vorgenommen wurden
        const waitTime = (greekAdjusted || englishAdjusted) ? 400 : 300;
        
        // Prüfe welche Abschnitte vollständig sichtbar sind
        setTimeout(() => {
            const greekVisible = getFullyVisibleSections(greekScrollContainer, greekSectionEls);
            const englishVisible = getFullyVisibleSections(englishScrollContainer, englishSectionEls);
            
            // Bestimme den aktuellen Abschnitt
            if (greekVisible.length > 0 || englishVisible.length > 0) {
                const lastSectionIndex = sectionCount - 1;
                
                // Wenn der letzte Abschnitt vollständig sichtbar ist, verwende diesen
                if (greekVisible.includes(lastSectionIndex) && englishVisible.includes(lastSectionIndex)) {
                    currentSectionIndex = lastSectionIndex;
                } else {
                    // Verwende den letzten vollständig sichtbaren Abschnitt
                    const lastVisible = Math.max(
                        greekVisible.length > 0 ? greekVisible[greekVisible.length - 1] : -1,
                        englishVisible.length > 0 ? englishVisible[englishVisible.length - 1] : -1
                    );
                    if (lastVisible >= 0) {
                        currentSectionIndex = Math.min(sectionCount - 1, lastVisible);
                    }
                }
            }
            
            updateArrowDisabled();
            updateSectionCountDisplay();
            updateRatingDisplay();
            updateProgress();
        }, waitTime);
    }, 100);
}

// ========================================
// AUDIO: MP3 from audio_url, fallback TTS
// ========================================
function playAudio() {
    const s = stories[currentIndex];
    if (!s) return;

    const url = (s.audio_url || '').trim();
    if (url) {
        if (!audioEl) {
            audioEl = new Audio();
            audioEl.addEventListener('error', () => {
                console.warn('MP3 failed, using TTS');
                ttsFallback(s.greek_text);
            });
        }
        audioEl.src = url.startsWith('http') || url.startsWith('/') ? url : '/' + url.replace(/^\//, '');
        audioEl.play().catch(() => ttsFallback(s.greek_text));
        return;
    }

    ttsFallback(s.greek_text);
}

function ttsFallback(text) {
    if (!text) return;
    const clean = text.replace(/\n/g, ' ');
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(clean);
    u.lang = 'el-GR';
    u.rate = 0.85;
    const voices = window.speechSynthesis.getVoices();
    const v = voices.find(x => x.lang === 'el-GR' || x.lang.startsWith('el'));
    if (v) u.voice = v;
    window.speechSynthesis.speak(u);
}

// ========================================
// RATING & PROGRESSION (pro Abschnitt)
// ========================================
async function saveSectionRating(storyId, sectionIndex, rating) {
    if (!useSupabase || !supabaseClient || !currentUser?.id) return;
    const uid = currentUser.id;
    if (!uid || typeof storyId !== 'string' || storyId.length < 30) return;
    try {
        await supabaseClient
            .from('short_story_section_ratings')
            .upsert(
                { student_id: uid, story_id: storyId, section_index: sectionIndex, rating },
                { onConflict: ['student_id', 'story_id', 'section_index'] }
            );
    } catch (e) {
        console.warn('Could not save section rating:', e);
    }
}

async function handleRating(rating) {
    const s = stories[currentIndex];
    if (!s) return;
    const key = getSectionRatingKey();
    sectionRatingByKey[key] = rating;
    await saveSectionRating(s.id, currentSectionIndex, rating);
    storiesReviewed++;
    updateRatingDisplay();

    if (currentSectionIndex < sectionCount - 1) {
        scrollToSection(currentSectionIndex + 1);
        return;
    }
    if (currentIndex >= stories.length - 1) {
        showCompletion();
        return;
    }
    nextStory();
}

function nextStory() {
    phraseCard.classList.add('fade-out');
    setTimeout(() => {
        currentIndex++;
        loadStory(currentIndex);
        updateProgress();
        phraseCard.classList.remove('fade-out');
        phraseCard.classList.add('fade-in');
        setTimeout(() => phraseCard.classList.remove('fade-in'), 500);
    }, 500);
}

function updateProgress() {
    const total = Math.max(1, sectionCount);
    const pct = total ? ((currentSectionIndex + 1) / total) * 100 : 0;
    if (progressFill) progressFill.style.width = `${pct}%`;
}

function showCompletion() {
    phraseCard.classList.add('fade-out');
    setTimeout(() => {
        mainCardArea.style.display = 'none';
        const pw = document.querySelector('.progress-wrapper');
        if (pw) pw.style.display = 'none';
        phrasesReviewedSpan.textContent = storiesReviewed;
        completionScreen.classList.add('active');
    }, 500);
}

async function restartSession() {
    currentIndex = 0;
    storiesReviewed = 0;
    Object.keys(sectionRatingByKey).forEach((k) => delete sectionRatingByKey[k]);
    stories = await loadStoriesFromSupabase();
    if (stories.length === 0) {
        showNoStories();
        return;
    }
    completionScreen.classList.remove('active');
    mainCardArea.style.display = 'flex';
    const pw = document.querySelector('.progress-wrapper');
    if (pw) pw.style.display = 'block';
    loadStory(currentIndex);
    updateProgress();
}

// ========================================
// EVENT LISTENERS
// ========================================
function attachListeners() {
    audioBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        playAudio();
    });

    cancelBtn?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.location.href = '/dashboard';
    });

    restartBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        restartSession();
    });

    ratingButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const r = btn.dataset.rating;
            if (r) handleRating(r);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === '1') handleRating('hard');
        if (e.key === '2') handleRating('good');
        if (e.key === '3') handleRating('easy');
        if (e.key === 'a' || e.key === 'A') {
            e.preventDefault();
            playAudio();
        }
        if (e.key === 'ArrowUp') { e.preventDefault(); scrollSectionUp(); }
        if (e.key === 'ArrowDown') { e.preventDefault(); scrollSectionDown(); }
        if (e.key === 'Escape') window.location.href = '/dashboard';
    });

    const enContainer = document.querySelector('.english-translation-container');
    if (enContainer) {
        enContainer.addEventListener('click', function() {
            this.classList.remove('blurred');
        });
    }

    document.querySelectorAll('.scroll-arrow.scroll-up').forEach((btn) => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); scrollSectionUp(); });
    });
    document.querySelectorAll('.scroll-arrow.scroll-down').forEach((btn) => {
        btn.addEventListener('click', (e) => { e.stopPropagation(); scrollSectionDown(); });
    });

    const backBtn = document.getElementById('backToDashboardBtn');
    if (backBtn) backBtn.addEventListener('click', () => { window.location.href = '/dashboard'; });
}

// ========================================
// START
// ========================================
function start() {
    if (!useSupabase) {
        setTimeout(() => {
            initializeSupabase();
            init();
        }, 500);
        return;
    }
    init();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => setTimeout(start, 300));
} else {
    setTimeout(start, 300);
}
