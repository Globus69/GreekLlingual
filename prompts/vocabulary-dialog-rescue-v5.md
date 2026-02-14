# GreekLingua – Rettungs-Prompt: Vokabeln-Dialog komplett neu & kompakt (Version 5)

**Projekt**: GreekLingua  
**Entwicklungsumgebung**: http://localhost:3001  
**Ziel dieses Prompts**: Den Vokabeln-Dialog von Grund auf neu schreiben – KOMPAKT, klar, fehlerfrei, ohne Altlasten. Ignoriere alle vorherigen Versionen außer dem unten stehenden Code.

**Aktueller (fehlerhafter) Code-Schnipsel (als Referenz – bitte komplett neu schreiben!):**


<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GreekLingua Dashboard</title>
    <!-- Supabase Client -->
    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <style>
        :root {
            --bg-body: #0F0F11;
            --bg-card: #1C1C1E;
            --bg-card-hover: #242426;
            --accent: #007AFF;
            --accent-glow: rgba(0, 122, 255, 0.3);
            --text-main: #EDEDED;
            --text-sub: #8E8E93;
            --border-light: rgba(255, 255, 255, 0.05);
            --font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        * {
            box-sizing: border-box;
            user-select: none;
        }

        body {
            margin: 0;
            padding: 0;
            background-color: var(--bg-body);
            color: var(--text-main);
            font-family: var(--font-family);
            height: 100vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            -webkit-font-smoothing: antialiased;
        }

        /* DEBUG COLORS (User Requested) - DISABLED */
        /*
        header { background: rgba(255, 0, 0, 0.1) !important; border: 1px solid red; position: relative; }
        .hero-section { background: rgba(0, 255, 0, 0.1); border: 1px solid green; position: relative; }
        .stats-card { background: rgba(0, 0, 255, 0.1) !important; border: 1px dashed blue; position: relative; }
        .modules-grid { background: rgba(0, 255, 255, 0.1); border: 1px dashed cyan; position: relative; }
        .tile { background: rgba(255, 0, 255, 0.1) !important; border: 1px dotted magenta; }
        */



        /* HEADER */
        header {
            height: 70px;
            padding: 0 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px solid var(--border-light);
            background: rgba(15, 15, 17, 0.9);
            backdrop-filter: blur(20px);
            z-index: 100;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 12px;
            font-size: 20px;
            font-weight: 700;
            color: #fff;
        }
        
        .brand-icon { font-size: 24px; }

        .user-profile {
            display: flex;
            align-items: center;
            gap: 12px;
            background: #1C1C1E;
            padding: 6px 16px 6px 6px;
            border-radius: 30px;
            border: 1px solid var(--border-light);
            cursor: pointer;
        }

        .avatar {
            width: 32px; height: 32px;
            background: linear-gradient(135deg, #007AFF, #5856D6);
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 13px; font-weight: 700; color: white;
        }

        .username { font-size: 14px; font-weight: 600; color: var(--text-main); }

        .datetime-display {
            font-size: 13px;
            font-weight: 500;
            color: #6E6E73;
            font-family: 'SF Mono', 'Monaco', 'Courier New', monospace;
            letter-spacing: 0.5px;
            text-shadow: 0 1px 0 rgba(255, 255, 255, 0.05), 0 -1px 0 rgba(0, 0, 0, 0.5);
            padding: 6px 12px;
            background: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            border: 1px solid rgba(0, 0, 0, 0.3);
            box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.5);
        }

        /* VIEW MANAGEMENT */
        .view {
            display: none;
            flex: 1;
            flex-direction: column;
            overflow: hidden;
            height: 100%;
            animation: fadeIn 0.4s ease-out;
        }
        
        .view.active {
            display: flex;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }

        /* DASHBOARD CONTENT */
        .dashboard-content {
            padding: 24px 32px;
            gap: 24px;
            max-width: 1400px;
            width: 100%;
            margin: 0 auto;
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden; 
        }

        .hero-section {
            display: flex;
            gap: 32px;
            align-items: stretch;
            height: 200px;
            flex-shrink: 0;
        }

        .stats-card {
            background: linear-gradient(160deg, #1C1C1E 0%, #151517 100%);
            border-radius: 24px;
            width: 340px;
            padding: 24px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            border: 1px solid var(--border-light);
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            position: relative;
            overflow: hidden;
        }

        .stats-card::after {
            content: '';
            position: absolute;
            top: -40px; right: -40px;
            width: 120px; height: 120px;
            background: radial-gradient(circle, rgba(0, 122, 255, 0.15), transparent 70%);
            pointer-events: none;
        }

        .stats-top { display: flex; justify-content: space-between; align-items: flex-start; }
        .level-badge { font-size: 32px; font-weight: 800; color: #fff; line-height: 1; }
        .level-label { font-size: 11px; color: var(--text-sub); font-weight: 700; text-transform: uppercase; margin-bottom: 4px; }
        .streak { background: rgba(255, 69, 58, 0.12); color: #FF453A; padding: 6px 12px; border-radius: 12px; font-size: 13px; font-weight: 700; display: flex; align-items: center; gap: 6px; }
        .stats-mid { display: flex; gap: 24px; margin-top: 10px; }
        .stat-item .val { font-size: 16px; font-weight: 700; color: #fff; }
        .stat-item .lbl { font-size: 11px; color: var(--text-sub); }
        .stats-footer { margin-top: auto; border-top: 1px solid rgba(255, 255, 255, 0.08); padding-top: 12px; font-size: 13px; color: #D1D1D6; line-height: 1.4; }

        .actions-group {
            display: flex;
            flex-direction: column;
            gap: 12px;
            justify-content: center;
            flex: 1;
            display: flex;
            flex-direction: row;
            align-items: center;
            gap: 24px;
        }
        
        .action-column { display: flex; flex-direction: column; gap: 16px; }

        .actions-inner-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            grid-template-rows: repeat(3, 1fr);
            gap: 12px;
            width: 100%;
            height: 100%;
            padding: 12px;
            border-radius: 12px;
        }

        .grid-cell {
            background: transparent;
            border: none;
            border-radius: 8px;
            display: flex;
            align-items: stretch;
            justify-content: stretch;
            min-height: 40px;
        }

        .grid-cell .btn {
            width: 100%;
            height: 100%;
            min-width: auto;
            min-height: auto;
        }

        .btn {
            border: none; 
            border-radius: 18px; 
            font-family: inherit; 
            font-weight: 700; 
            cursor: pointer;
            transition: all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            gap: 10px; 
            position: relative; 
            overflow: hidden;
            /* Glassmorphism Effect */
            background: rgba(255, 255, 255, 0.1) !important;
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
        }
        .btn:hover { transform: translateY(-2px) scale(1.02); box-shadow: 0 8px 25px rgba(0,0,0,0.3); }
        .btn:active { transform: scale(0.98); }

        .btn-primary { background: var(--accent); color: white; width: 50%; height: 50%; font-size: 17px; box-shadow: 0 8px 25px rgba(0, 122, 255, 0.25); min-width: 200px; min-height: 50px; }
        .btn-secondary { background: rgba(0, 122, 255, 0.1); color: #409CFF; width: 50%; height: 50%; font-size: 17px; border: 1px solid rgba(0, 122, 255, 0.2); min-width: 200px; min-height: 50px; }
        .btn-tertiary { background: transparent; color: #FF453A; border: 1px solid rgba(255, 69, 58, 0.3); font-size: 14px; height: 50%; width: 50%; border-radius: 14px; min-width: 200px; min-height: 45px; }

        .modules-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 2px;
            padding: 10px 0 32px 0;
            overflow-y: auto;
            flex: 1;
        }
        
        .modules-grid::-webkit-scrollbar { width: 6px; }
        .modules-grid::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 10px; }

        .tile {
            background: var(--bg-card); 
            border-radius: 24px; 
            width: 50%; 
            height: 50%; 
            min-width: 180px;
            min-height: 180px;
            display: flex; 
            flex-direction: column;
            align-items: center; 
            justify-content: center; 
            border: 1px solid var(--border-light); 
            cursor: pointer; 
            transition: all 0.2s; 
            position: relative;
        }
        .tile:hover { background: var(--bg-card-hover); transform: scale(1.03); box-shadow: 0 15px 40px rgba(0,0,0,0.4); border-color: rgba(255,255,255,0.1); z-index: 5; }
        .tile-icon { font-size: 56px; margin-bottom: 20px; transition: transform 0.2s; }
        .tile:hover .tile-icon { transform: scale(1.1); }
        .tile-label { font-size: 17px; font-weight: 700; color: var(--text-main); text-align: center; }
        .tile-sub { font-size: 12px; color: var(--text-sub); margin-top: 4px; font-weight: 500; }

        /* MODULE VIEWS STYLES */
        .module-header {
            padding: 20px 32px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            background: transparent;
            border-bottom: 1px solid var(--border-light);
            flex-shrink: 0;
        }

        .back-btn {
            background: rgba(255, 255, 255, 0.08); border: none; color: #007AFF; font-size: 15px; font-weight: 600;
            cursor: pointer; padding: 8px 16px; border-radius: 20px; display: flex; align-items: center; gap: 6px;
        }
        .back-btn:hover { background: rgba(0, 122, 255, 0.15); }

        .module-content {
            flex: 1;
            padding: 30px;
            overflow-y: auto;
            display: flex;
            justify-content: center;
        }

        /* Flashcard Specifics */
         .card-area { width: 100%; display: flex; justify-content: center; align-items: center; perspective: 1200px; flex-direction: column; gap: 30px; }
         .card-wrapper { position: relative; width: 600px; height: 400px; }
         .card { position: relative; width: 100%; height: 100%; transform-style: preserve-3d; transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1); cursor: pointer; }
         .card.flipped { transform: rotateY(180deg); }
         .card-face { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; background: #1C1C1E; border-radius: 32px; box-shadow: 0 20px 50px rgba(0,0,0,0.4); display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 40px; border: 1px solid var(--border-light); }
         .card-back { transform: rotateY(180deg); background: #1C1C1E; }
         .lang-label { position: absolute; top: 30px; font-size: 12px; font-weight: 700; color: #636366; letter-spacing: 2px; }
         .main-word { font-size: 64px; font-weight: 800; color: #EDEDED; text-align: center; margin-bottom: 20px; }
         .example-sentence { font-size: 18px; color: #8E8E93; font-style: italic; text-align: center; }
         .controls-bar { display: flex; gap: 20px; }

         /* Lists (Phrasen, etc) */
         .list-container { width: 100%; max-width: 800px; display: flex; flex-direction: column; gap: 12px; }
         .list-item { background: #1C1C1E; border-radius: 18px; padding: 20px 30px; display: flex; justify-content: space-between; align-items: center; border: 1px solid var(--border-light); transition: background 0.2s; }
         .list-item:hover { background: #242426; border-color: var(--accent); }
         
         /* Quiz */
         .quiz-box { background: #1C1C1E; border-radius: 24px; padding: 48px; max-width: 800px; line-height: 2; font-size: 20px; color: #D1D1D6; border: 1px solid var(--border-light); }
         .quiz-word { color: #FF453A; text-decoration: underline; text-decoration-color: rgba(255, 69, 58, 0.3); text-underline-offset: 4px; cursor: pointer; }
         .quiz-word:hover { background: rgba(255, 69, 58, 0.15); }

        /* Login Overlay */
        #login-overlay {
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: #0F0F11; z-index: 9999; display: flex; align-items: center; justify-content: center;
            transition: opacity 0.5s ease;
        }
        
        /* Toast */
        .toast {
            position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(100px);
            background: rgba(30, 30, 32, 0.95); padding: 14px 28px; border-radius: 50px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.1);
            display: flex; align-items: center; gap: 10px; transition: transform 0.4s; opacity: 0;
            pointer-events: none; z-index: 1000;
        }
        .toast.show { transform: translateX(-50%) translateY(0); opacity: 1; }

    </style>
</head>
<body>

    <div id="login-overlay">
        <h1 style="color:white; font-size: 24px;">🏛️ Logging in...</h1>
    </div>

    <div id="app">
        <!-- HEADER (Shared) -->
        <header class="debug-flex">
            <div class="brand"><span class="brand-icon">🏛️</span> GreekLingua</div>
            <div class="datetime-display" id="datetime">20.01.2026 21:53:05</div>
            <div class="user-profile"><div class="avatar">SW</div><span class="username">SWS</span></div>
        </header>

        <!-- DASHBOARD VIEW -->
        <div id="dashboard-view" class="view active">
            <div class="dashboard-content debug-flex">
                <div class="hero-section debug-flex">
                    <div class="stats-card debug-flex">
                        <div class="stats-top">
                            <div><div class="level-label">Current Level</div><div class="level-badge">B1</div></div>
                            <div class="streak"><span>🔥</span> 5 Days</div>
                        </div>
                        <div class="stats-mid">
                            <div class="stat-item"><div class="val">187</div><div class="lbl">Vocabs</div></div>
                            <div class="stat-item"><div class="val">14.5h</div><div class="lbl">Learned</div></div>
                        </div>
                        <div class="stats-footer"><i>Today:</i> 12 new vocabs & 1 short text.</div>
                    </div>
                    <div class="actions-group debug-flex">
                        <div class="actions-inner-grid debug-grid">
                            <div class="grid-cell">
                                <button class="btn btn-primary" onclick="showToast('✨ Preparing Magic Round...')"><span>✨</span> Start Magic Round</button>
                            </div>
                            <div class="grid-cell">
                                <button class="btn btn-primary" style="background:#FF5722;" onclick="showToast('📖 Starting Comprehension...')"><span>📖</span> Comprehension</button>
                            </div>
                            <div class="grid-cell">
                                <button class="btn btn-primary" style="background:#FF9800 !important;" onclick="showToast('📝 Starting Exam Test...')"><span>📝</span> Exam Test</button>
                            </div>
                            <div class="grid-cell">
                                <button class="btn btn-secondary" onclick="showToast('⚡️ Quick Lesson Started')"><span>⚡️</span> 20 min Quick Lesson</button>
                            </div>
                            <div class="grid-cell">
                                <button class="btn btn-primary" style="background:#00BCD4;" onclick="showToast('🎮 Starting Game...')"><span>🎮</span> Game</button>
                            </div>
                            <div class="grid-cell">
                                <button class="btn btn-secondary" onclick="showToast('🧪 Running Test...')"><span>🧪</span> Test</button>
                            </div>
                            <div class="grid-cell">
                                <button class="btn btn-primary" style="background:#34C759;" onclick="showToast('📅 Lesson Started')"><span>📅</span> Lesson Today</button>
                            </div>
                            <div class="grid-cell">
                                <button class="btn btn-tertiary" onclick="openView('vokabeln-view')"><span>🔁</span> Vokabeln wiederholen</button>
                            </div>
                            <div class="grid-cell">
                                <button class="btn btn-secondary" onclick="window.print()"><span>🖨️</span> Print</button>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="modules-grid debug-grid">
                    <div class="tile active" onclick="openView('vokabeln-view')">
                        <div class="tile-icon">📝</div><div class="tile-label">Vokabeln</div><div class="tile-sub">12 Due</div>
                    </div>
                    <div class="tile" onclick="openView('phrases-view')">
                        <div class="tile-icon">💬</div><div class="tile-label">Phrases</div><div class="tile-sub">Travel</div>
                    </div>
                    <div class="tile" onclick="openView('quiz-view')">
                        <div class="tile-icon">❓</div><div class="tile-label">Quiz</div><div class="tile-sub">Reading</div>
                    </div>
                    <div class="tile" onclick="openView('cyprus-view')">
                         <div class="tile-icon">🏛️</div><div class="tile-label">Cyprus</div><div class="tile-sub">Exam Prep</div>
                    </div>
                    <div class="tile" onclick="showToast('Exam Quiz coming soon')">
                        <div class="tile-icon">❓</div><div class="tile-label">Quiz</div><div class="tile-sub">Reading</div>
                    </div>
                    <div class="tile" onclick="showToast('Video Class coming soon')">
                        <div class="tile-icon">🎥</div><div class="tile-label">Video Class</div>
                    </div>
                    <div class="tile" onclick="showToast('Audio Player coming soon')">
                         <div class="tile-icon">🎧</div><div class="tile-label">Audio</div>
                    </div>
                    <div class="tile" onclick="showToast('Library coming soon')">
                        <div class="tile-icon">📚</div><div class="tile-label">Library</div>
                    </div>
                    <div class="tile" onclick="showToast('📚 Opening Stories...')">
                        <div class="tile-icon">📚</div><div class="tile-label">Stories</div><div class="tile-sub">Short Stories</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- VOKABELN VIEW -->
        <div id="vokabeln-view" class="view">
            <div class="module-header debug-flex">
                <button class="back-btn" onclick="openDashboard()">← Dashboard</button>
                <div class="progress-container" id="vocab-progress">Lade Daten...</div>
                <div style="font-weight:600">Vocabulary Flashcards</div>
            </div>
            <div class="module-content debug-flex">
                <div class="card-area debug-flex">
                    <div class="card-wrapper">
                        <div class="card" id="flashcard" onclick="flipCard()">
                            <div class="card-face card-front">
                                <span class="lang-label">ENGLISH</span>
                                <div class="main-word" id="word-front">...</div>
                                <div class="example-sentence" id="example-front">...</div>
                                <div class="flip-hint">Click to flip</div>
                            </div>
                            <div class="card-face card-back">
                                <span class="lang-label">ΕΛΛΗΝΙΚΑ</span>
                                <div class="main-word" id="word-back">...</div>
                                <div class="example-sentence" id="example-back">...</div>
                            </div>
                        </div>

                        <div class="rating-bar debug-flex">
                            <button class="control-btn outline" onclick="rateVocab(1)">🔴 Schwer</button>
                            <button class="control-btn primary" onclick="rateVocab(2.5)">🟡 Gut</button>
                            <button class="control-btn primary" style="background:#34C759;" onclick="rateVocab(3)">🟢 Sehr gut</button>
                        </div>
                    </div>
                    <div class="controls-bar debug-flex" id="nav-controls">
                        <button class="btn btn-secondary" style="width:120px;" id="prev-btn" onclick="prevCard()">Prev</button>
                        <button class="btn btn-primary" style="width:160px;" onclick="flipCard()">Flip</button>
                        <button class="btn btn-secondary" style="width:120px;" id="next-btn" onclick="nextCard()">Next</button>
                    </div>
                </div>
            </div>
        </div>

        <!-- PHRASES VIEW -->
        <div id="phrases-view" class="view">
             <div class="module-header">
                <button class="back-btn" onclick="openView('dashboard-view')">← Dashboard</button>
                <div style="font-weight:600">Common Phrases</div>
            </div>
            <div class="module-content">
                <div class="list-container" id="phrases-list-container">
                    <!-- JS Injected -->
                </div>
            </div>
        </div>

        <!-- QUIZ VIEW -->
        <div id="quiz-view" class="view">
             <div class="module-header">
                <button class="back-btn" onclick="openView('dashboard-view')">← Dashboard</button>
                <div style="font-weight:600">Reading Quiz</div>
            </div>
            <div class="module-content">
                <div class="quiz-box">
                    <p id="quiz-content"></p>
                </div>
            </div>
        </div>
        
        <!-- CYPRUS VIEW -->
        <div id="cyprus-view" class="view">
            <div class="module-header">
               <button class="back-btn" onclick="openView('dashboard-view')">← Dashboard</button>
               <div style="font-weight:600">Cyprus Exam Preparation</div>
           </div>
           <div class="module-content">
               <div class="modules-grid" style="grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); padding:0;">
                   <div class="tile" onclick="showToast('Listening Exercise...')">
                       <div class="tile-icon">🎧</div><div class="tile-label">Listening</div>
                   </div>
                   <div class="tile" onclick="showToast('Reading Exercise...')">
                        <div class="tile-icon">📖</div><div class="tile-label">Reading</div>
                   </div>
                   <div class="tile" onclick="showToast('Writing Exercise...')">
                        <div class="tile-icon">✍️</div><div class="tile-label">Writing</div>
                   </div>
               </div>
           </div>
       </div>

        <!-- TOAST -->
        <div id="toast" class="toast"><span>🚀</span><span id="toast-msg">Action started</span></div>

    </div>

    <script>
        // DATA
        const vocab = [
            { en: "Hello", gr: "Γεια σου", ex_en: "Hello friend", ex_gr: "Γεια σου φίλε" },
            { en: "Thank you", gr: "Ευχαριστώ", ex_en: "Thank you very much", ex_gr: "Ευχαριστώ πολύ" },
            { en: "Water", gr: "Νερό", ex_en: "I want water", ex_gr: "Θέλω νερό" }
        ];
        const phrases = [
            { en: "Good morning", gr: "Καλημέρα" },
            { en: "How are you?", gr: "Τι κάνεις;" },
            { en: "I'm fine", gr: "Είμαι καλά" }
        ];
        const quizText = `Σήμερα είναι μια όμορφη <u class="quiz-word" onclick="alert('Day')">μέρα</u>.`;

        // STATE
        let currentVocabIdx = 0;
        let isFlipped = false;

        // INIT
        window.onload = () => {
            // Login Animation
            setTimeout(() => {
                const overlay = document.getElementById('login-overlay');
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 500);
            }, 1000);

            // Load Data
            loadPhrases();
            document.getElementById('quiz-content').innerHTML = quizText;
            updateCard();
            
            // Start live datetime
            updateDateTime();
            setInterval(updateDateTime, 1000);
        };

        // Update DateTime Display
        function updateDateTime() {
            const now = new Date();
            const day = String(now.getDate()).padStart(2, '0');
            const month = String(now.getMonth() + 1).padStart(2, '0');
            const year = now.getFullYear();
            const hours = String(now.getHours()).padStart(2, '0');
            const minutes = String(now.getMinutes()).padStart(2, '0');
            const seconds = String(now.getSeconds()).padStart(2, '0');
            
            const dateTimeStr = `${day}.${month}.${year} ${hours}:${minutes}:${seconds}`;
            document.getElementById('datetime').innerText = dateTimeStr;
        }

        // NAVIGATION
        function openView(viewId) {
            document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
            document.getElementById(viewId).classList.add('active');
        }

        function showToast(msg) {
            const t = document.getElementById('toast');
            document.getElementById('toast-msg').innerText = msg;
            t.classList.add('show');
            setTimeout(() => t.classList.remove('show'), 2000);
        }

        // MODULE LOGIC
        function loadPhrases() {
            const container = document.getElementById('phrases-list-container');
            container.innerHTML = phrases.map(p => `
                <div class="list-item">
                    <span style="color:#EDEDED">${p.en}</span>
                    <span style="color:#007AFF; font-weight:700">${p.gr}</span>
                </div>
            `).join('');
        }

        // FLASHCARD
        function updateCard() {
            const v = vocab[currentVocabIdx];
            document.getElementById('word-front').innerText = v.en;
            document.getElementById('example-front').innerText = v.ex_en;
            document.getElementById('word-back').innerText = v.gr;
            document.getElementById('example-back').innerText = v.ex_gr;
        }

        function flipCard() {
            const c = document.getElementById('flashcard');
            isFlipped = !isFlipped;
            isFlipped ? c.classList.add('flipped') : c.classList.remove('flipped');
        }

        function nextCard() {
            if (currentVocabIdx < vocab.length - 1) {
                currentVocabIdx++;
                resetCard();
            }
        }

        function prevCard() {
            if (currentVocabIdx > 0) {
                currentVocabIdx--;
                resetCard();
            }
        }

        function resetCard() {
            isFlipped = false;
            document.getElementById('flashcard').classList.remove('flipped');
            setTimeout(updateCard, 300);
        }
    </script>
</body>
</html>

/* Global Styles */
body {
    background-color: #0F0F11;
    /* Deep off-black */
    color: #EDEDED;
    margin: 0;
    padding: 0;
    height: 100vh;
    overflow: hidden;
    /* App-like feel */
    -webkit-font-smoothing: antialiased;
}

#app {
    height: 100%;
    width: 100%;
    position: relative;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
}

/* Views Management */
.view {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
    display: flex;
    flex-direction: column;
    z-index: 0;
    background-color: #0F0F11;
}

.view.active {
    opacity: 1;
    pointer-events: all;
    z-index: 10;
}

/* =========================================
   LOGIN VIEW
   ========================================= */
.login-container {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: radial-gradient(circle at 50% 30%, rgba(0, 122, 255, 0.08), transparent 60%);
}

.login-card {
    width: 380px;
    background: rgba(28, 28, 30, 0.7);
    backdrop-filter: blur(40px);
    -webkit-backdrop-filter: blur(40px);
    border-radius: 28px;
    padding: 48px 40px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    animation: fadeInUp 0.8s ease-out;
}

.login-logo {
    font-size: 56px;
    margin-bottom: 24px;
    filter: drop-shadow(0 0 20px rgba(0, 122, 255, 0.3));
}

.login-title {
    font-size: 28px;
    font-weight: 700;
    color: #fff;
    margin-bottom: 8px;
}

.login-subtitle {
    font-size: 14px;
    color: #8E8E93;
    margin-bottom: 40px;
    text-align: center;
}

.input-group {
    width: 100%;
    margin-bottom: 20px;
}

.login-input {
    width: 100%;
    background: rgba(0, 0, 0, 0.3);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 16px 20px;
    font-size: 16px;
    color: #fff;
    outline: none;
    transition: all 0.2s;
    box-sizing: border-box;
    font-family: inherit;
}

.login-input::placeholder {
    color: #555;
}

.login-input:focus {
    border-color: #007AFF;
    background: rgba(0, 0, 0, 0.5);
    box-shadow: 0 0 0 4px rgba(0, 122, 255, 0.15);
}

.login-btn {
    width: 100%;
    background: #007AFF;
    color: white;
    border: none;
    padding: 18px;
    border-radius: 18px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    margin-top: 10px;
    box-shadow: 0 8px 30px rgba(0, 122, 255, 0.35);
    transition: all 0.2s;
}

.login-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 12px 40px rgba(0, 122, 255, 0.5);
    background: #0066CC;
}

.biometric-btn {
    margin-top: 24px;
    background: transparent;
    border: none;
    color: #007AFF;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    opacity: 0.8;
}

.biometric-btn:hover {
    opacity: 1;
}

/* =========================================
   DASHBOARD 2.0 STYLES
   ========================================= */

.app-header {
    padding: 20px 60px 0 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 80px;
    position: sticky;
    top: 0;
    z-index: 100;
    background: rgba(15, 15, 17, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.header-content {
    display: flex;
    align-items: center;
    gap: 16px;
}

.header-logo {
    font-size: 24px;
}

.header-content h1 {
    font-size: 22px;
    font-weight: 700;
    margin: 0;
    color: #EDEDED;
    letter-spacing: -0.5px;
}

.user-profile {
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(255, 255, 255, 0.05);
    padding: 6px 16px 6px 6px;
    border-radius: 30px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    cursor: pointer;
    transition: background 0.2s;
}

.user-profile:hover {
    background: rgba(255, 255, 255, 0.1);
}

.avatar {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, #007AFF, #5856D6);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
}

.username {
    font-size: 13px;
    font-weight: 600;
    color: #EDEDED;
}

/* Hero Section (Stats & Actions) */
.dashboard-hero {
    padding: 40px 60px;
    display: flex;
    gap: 32px;
    align-items: stretch;
    flex-wrap: wrap;
    animation: fadeIn 0.6s ease-out;
}

/* Stats Card */
.stats-card {
    background: linear-gradient(160deg, #1C1C1E 0%, #151517 100%);
    border-radius: 24px;
    padding: 24px 28px;
    width: 320px;
    min-width: 300px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
}

/* Top Glow */
.stats-card::before {
    content: '';
    position: absolute;
    top: -50px;
    right: -50px;
    width: 100px;
    height: 100px;
    background: radial-gradient(circle, rgba(0, 122, 255, 0.2), transparent 70%);
    pointer-events: none;
}

.stats-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 20px;
}

.level-info {
    display: flex;
    flex-direction: column;
}

.level-label {
    font-size: 11px;
    color: #8E8E93;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
}

.level-val {
    font-size: 32px;
    font-weight: 800;
    color: #fff;
    line-height: 1.1;
}

.streak-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: rgba(255, 69, 58, 0.15);
    color: #FF453A;
    padding: 6px 10px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 700;
}

.stats-grid {
    display: flex;
    gap: 24px;
}

.mini-stat {
    display: flex;
    flex-direction: column;
}

.mini-val {
    font-size: 16px;
    font-weight: 700;
    color: #EDEDED;
}

.mini-lbl {
    font-size: 11px;
    color: #8E8E93;
}

.daily-tip {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid rgba(255, 255, 255, 0.08);
    font-size: 13px;
    color: #D1D1D6;
    line-height: 1.4;
}

.tip-highlight {
    color: #007AFF;
    font-weight: 500;
}

/* Action Area */
.action-area {
    display: flex;
    flex-direction: column;
    gap: 16px;
    justify-content: center;
    flex: 1;
    min-width: 320px;
    align-items: center;
    /* Center items for 40% width look */
}

.button-row {
    display: flex;
    gap: 16px;
    width: 100%;
    justify-content: center;
}

.action-btn {
    height: 72px;
    /* Large touch area */
    border-radius: 20px;
    border: none;
    font-size: 18px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
    display: flex;
    align-items: center;
    padding: 0 32px;
    gap: 16px;
    font-family: inherit;
    position: relative;
    overflow: hidden;
    width: 40%;
    /* User requested 40% size */
    min-width: 250px;
}

.magic-btn {
    background: #007AFF;
    color: white;
    box-shadow: 0 10px 30px rgba(0, 122, 255, 0.3);
}

.magic-btn:hover {
    background: #0062CC;
    transform: scale(1.02) translateY(-2px);
    box-shadow: 0 15px 40px rgba(0, 122, 255, 0.4);
}

.magic-icon {
    font-size: 24px;
}

.quick-btn {
    background: rgba(28, 28, 30, 0.6);
    color: #0A84FF;
    /* Lighter blue for dark mode text */
    border: 1px solid rgba(10, 132, 255, 0.3);
}

.quick-btn:hover {
    background: rgba(10, 132, 255, 0.1);
    border-color: #0A84FF;
    transform: scale(1.02);
}

/* Dashboard Grid Upgrade */
.dashboard-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    /* Larger Tiles */
    gap: 32px;
    /* Increased Gap */
    padding: 0 60px 80px 60px;
    overflow-y: auto;
    flex: 1;
    /* Take remaining space */
}

.tile {
    background: #1C1C1E;
    border-radius: 28px;
    padding: 30px;
    aspect-ratio: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    cursor: pointer;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    position: relative;
}

.tile:hover {
    transform: translateY(-6px) scale(1.03);
    background: #242426;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
    border-color: rgba(255, 255, 255, 0.12);
    z-index: 2;
}

.tile:active {
    transform: scale(0.98);
}

.tile-icon {
    font-size: 52px;
    margin-bottom: 16px;
    transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.tile:hover .tile-icon {
    transform: scale(1.1);
}

.tile-title {
    font-size: 19px;
    font-weight: 700;
    margin-bottom: 6px;
    text-align: center;
    color: #EDEDED;
}

.tile-subtitle {
    font-size: 13px;
    color: #8E8E93;
    text-align: center;
    font-weight: 500;
}

.active-tile {
    border: 1px solid rgba(0, 122, 255, 0.4);
    background: linear-gradient(160deg, #1C1C1E 0%, #171d26 100%);
}

.active-tile .tile-title {
    color: #64D2FF;
    /* Highlight active titles slightly */
}

/* =========================================
   MODULE STYLES (Preserved & Tweaked)
   ========================================= */

/* General Module Header */
.module-header {
    padding: 30px 60px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(15, 15, 17, 0.9);
    backdrop-filter: blur(20px);
    position: sticky;
    top: 0;
    z-index: 5;
}

.back-btn {
    background: rgba(255, 255, 255, 0.08);
    /* Slight pill bg */
    border: none;
    color: #007AFF;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    padding: 8px 16px 8px 12px;
    border-radius: 20px;
    transition: all 0.2s;
    font-family: inherit;
    display: flex;
    align-items: center;
    gap: 4px;
}

.back-btn:hover {
    background: rgba(0, 122, 255, 0.15);
    transform: translateX(-2px);
}

.progress-container {
    color: #A0A0A5;
    font-size: 14px;
    font-weight: 600;
    background: #1C1C1E;
    padding: 6px 14px;
    border-radius: 12px;
}

/* Flashcard */
.card-area {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    perspective: 1200px;
    padding: 20px 40px;
    overflow: hidden;
}

.card-wrapper {
    position: relative;
    width: 600px;
    height: 400px;
}

.card {
    position: relative;
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
    /* Smoother flip */
    cursor: pointer;
}

.card.flipped {
    transform: rotateY(180deg);
}

.card-face {
    position: absolute;
    width: 100%;
    height: 100%;
    backface-visibility: hidden;
    background: #1C1C1E;
    border-radius: 32px;
    box-shadow: 0 20px 50px rgba(0, 0, 0, 0.4), inset 0 0 0 1px rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px;
    box-sizing: border-box;
}

.card-back {
    transform: rotateY(180deg);
    background: #1C1C1E;
    /* Keep consistent dark */
}

.lang-label {
    position: absolute;
    top: 40px;
    font-size: 13px;
    font-weight: 700;
    color: #636366;
    letter-spacing: 2px;
    text-transform: uppercase;
}

.main-word {
    font-size: 72px;
    font-weight: 800;
    color: #EDEDED;
    text-align: center;
    margin-bottom: 24px;
    letter-spacing: -1px;
    line-height: 1.1;
}

.example-sentence {
    font-size: 18px;
    color: #8E8E93;
    font-style: italic;
    text-align: center;
    line-height: 1.5;
    max-width: 85%;
}

.flip-hint {
    position: absolute;
    bottom: 30px;
    font-size: 12px;
    color: #3A3A3C;
    font-weight: 600;
    opacity: 0;
    transition: opacity 0.3s;
}

.card-face:hover .flip-hint {
    opacity: 0.6;
}

/* Controls */
.controls-bar {
    padding: 0 60px 40px 60px;
    display: flex;
    justify-content: center;
    gap: 20px;
    align-items: center;
}

.control-btn {
    font-family: inherit;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    border-radius: 16px;
}

.control-btn.outline {
    background: transparent;
    border: 2px solid #3A3A3C;
    color: #EDEDED;
    height: 52px;
    padding: 0 32px;
}

.control-btn.outline:hover:not(:disabled) {
    border-color: #007AFF;
    color: #007AFF;
}

.control-btn.outline:active:not(:disabled) {
    transform: scale(0.95);
}

.control-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
    border-color: #2C2C2E;
}

.control-btn.primary {
    background: #007AFF;
    border: none;
    color: white;
    box-shadow: 0 8px 25px rgba(0, 122, 255, 0.3);
    height: 56px;
    padding: 0 56px;
    font-size: 17px;
}

.control-btn.primary:hover {
    background: #0062CC;
    box-shadow: 0 12px 30px rgba(0, 122, 255, 0.45);
    transform: translateY(-2px);
}

.control-btn.primary:active {
    transform: translateY(1px);
}

/* Toasts */
.toast {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%) translateY(100px);
    background: rgba(30, 30, 32, 0.95);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    color: #fff;
    padding: 16px 32px;
    border-radius: 50px;
    font-size: 15px;
    font-weight: 500;
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.6);
    border: 1px solid rgba(255, 255, 255, 0.08);
    transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
    z-index: 2000;
    pointer-events: none;
    opacity: 0;
    display: flex;
    align-items: center;
    gap: 12px;
}

.toast.show {
    transform: translateX(-50%) translateY(0);
    opacity: 1;
}

/* =========================================
   OTHER MODULES
   ========================================= */
/* Reuse grid for videos/books */
.grid-container {
    padding: 20px 60px 60px 60px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 24px;
    overflow-y: auto;
    flex: 1;
}

.grid-item {
    background: #1C1C1E;
    border-radius: 20px;
    padding: 20px;
    aspect-ratio: 0.85;
    /* Portrait for books/videos */
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s;
    cursor: pointer;
}

.grid-item:hover {
    background: #242426;
    transform: scale(1.03);
    border-color: #007AFF;
}

.grid-icon {
    font-size: 40px;
    margin-bottom: 16px;
}

.grid-title {
    font-size: 14px;
    font-weight: 700;
    text-align: center;
    color: #fff;
}

/* Phrases List */
.phrases-list {
    padding: 20px 60px 60px 60px;
    flex: 1;
    overflow-y: auto;
    max-width: 900px;
    margin: 0 auto;
    width: 100%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.phrase-item {
    background: #1C1C1E;
    border-radius: 18px;
    padding: 24px 32px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    border: 1px solid rgba(255, 255, 255, 0.05);
    transition: all 0.2s;
}

.phrase-item:hover {
    background: #242426;
    border-color: rgba(0, 122, 255, 0.3);
}

.phrase-en {
    font-size: 16px;
    font-weight: 500;
    color: #EDEDED;
}

.phrase-gr {
    font-size: 18px;
    font-weight: 700;
    color: #007AFF;
    text-align: right;
}

/* Quiz */
.quiz-container {
    padding: 20px 60px;
    flex: 1;
    display: flex;
    justify-content: center;
}

.quiz-box {
    background: #1C1C1E;
    border-radius: 24px;
    padding: 48px;
    max-width: 800px;
    line-height: 2;
    font-size: 20px;
    color: #D1D1D6;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    border: 1px solid rgba(255, 255, 255, 0.06);
}

.quiz-word {
    color: #FF453A;
    text-decoration: underline;
    text-decoration-color: rgba(255, 69, 58, 0.3);
    text-underline-offset: 4px;
    cursor: pointer;
    font-weight: 600;
    transition: all 0.2s;
    padding: 0 4px;
    border-radius: 4px;
}

.quiz-word:hover {
    background: rgba(255, 69, 58, 0.15);
    color: #FF554A;
}

/* Vocabulary Module Enhancements */
.progress-container {
    padding: 10px 24px;
    background: rgba(255, 255, 255, 0.03);
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    color: var(--text-sub);
}

.rating-bar {
    display: none;
    gap: 16px;
    margin-top: 20px;
    animation: fadeIn 0.3s ease;
}

.card.flipped~.rating-bar {
    display: flex;
}

.control-btn {
    padding: 12px 24px;
    border-radius: 14px;
    font-weight: 700;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    border: 1px solid transparent;
}

.control-btn.outline {
    background: transparent;
    border: 1px solid rgba(255, 255, 255, 0.1);
    color: var(--text-main);
}

.control-btn.primary {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 4px 15px var(--accent-glow);
}

.control-btn:hover {
    transform: translateY(-2px);
    background: rgba(255, 255, 255, 0.08);
}

.control-btn.primary:hover {
    background: #1a8aff;
}

/* Debug Visualizer */
:root {
    --debug-flex: #FF3B30;
    --debug-grid: #34C759;
}

body {
    counter-reset: flex-id grid-id;
}

.debug-flex {
    outline: 2px solid var(--debug-flex) !important;
    position: relative;
    counter-increment: flex-id;
}

.debug-flex::after {
    content: "F" counter(flex-id);
    position: absolute;
    top: 0;
    right: 0;
    background: var(--debug-flex);
    color: white;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 6px;
    z-index: 9999;
    border-bottom-left-radius: 6px;
    pointer-events: none;
    line-height: 1;
}

.debug-grid {
    outline: 2px solid var(--debug-grid) !important;
    position: relative;
    counter-increment: grid-id;
}

.debug-grid::after {
    content: "G" counter(grid-id);
    position: absolute;
    top: 0;
    left: 0;
    background: var(--debug-grid);
    color: white;
    font-size: 10px;
    font-weight: 800;
    padding: 2px 6px;
    z-index: 9999;
    border-bottom-right-radius: 6px;
    pointer-events: none;
    line-height: 1;
}

@media (max-width: 768px) {

    /* ... (rest of the existing media query) */
    .dashboard-hero {
        padding: 30px 20px;
        gap: 24px;
    }

    .stats-card {
        width: 100%;
        min-width: auto;
        height: auto;
    }

    .action-area {
        width: 100%;
        min-width: auto;
    }

    .dashboard-grid {
        padding: 0 20px 60px 20px;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 16px;
    }

    .app-header {
        padding: 20px 20px;
    }

    .phrases-list,
    .grid-container,
    .quiz-container {
        padding-left: 20px;
        padding-right: 20px;
    }

    .card-wrapper {
        width: 100%;
        height: 500px;
    }

    .main-word {
        font-size: 42px;
    }

    .login-card {
        width: 90%;
        padding: 32px 24px;
    }
}

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




**Harte Regeln – verhandelbar:**
1. Dialog ist **nicht** full-view – width 460–500 px, height auto (max 55vh), zentriert, dunkles Overlay (opacity 0.9, blur 12px)
2. **KEINE doppelten Buttons** – nur Hard / Good / Easy unten (rot/gelb/grün, height 44–48 px, radius 16 px, Icons ↓ → ↑)
3. **Kein automatisches Schließen** – nach letzter Karte: „Fertig – X richtig / Y falsch“ + „Zurück zum Dashboard“-Button
4. Beim Schließen (× oder Beenden): Toast „Fortschritt gespeichert – super gemacht!“ (2–3 s)
5. Zähler oben: „Card 1/3“ + dünner Gradient-Balken (6 px, #007AFF → #00C6FF)
6. Karte selbst: max 420×260 px, „ENGLISH“ 14 px grau, Wort 52 px bold, Beispiel 16 px italic
7. Übergang: Fade + Scale (0.95 → 1, 300ms)
8. Beenden-Button unten mittig (grau/rot, „Beenden & Speichern“)

**Technik**:
- Nutze bestehende Klassen (.card, .flipped, .control-btn, .toast, .back-btn) wo möglich
- Neue Klasse: .vocabulary-dialog-rescue
- JS: async/await für Supabase (falls vorhanden), sonst statisch
- HTML/CSS/JS in einem zusammenhängenden Block ausgeben

**Ausgabe-Format**:
- Vollständiger <div id="vocabulary-dialog">…</div> HTML
- Alle neuen/ergänzten CSS-Regeln
- Vollständiger JavaScript-Code (Funktionen zum Öffnen/Schließen/Flip/Bewerten/Speichern)

Ignoriere alles Vorherige außer diesem Prompt und dem Code-Schnipsel oben.  
Gib nur den neuen Code – kein zusätzlicher Text. Starte direkt mit dem Code.