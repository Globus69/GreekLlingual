/**
 * Greek Text-to-Speech (TTS) Library
 * Uses Web Speech API for Greek pronunciation
 */

export interface GreekTTSOptions {
    rate?: number;      // Speech rate: 0.1 to 10 (default: 0.9)
    pitch?: number;     // Voice pitch: 0 to 2 (default: 1)
    volume?: number;    // Volume: 0 to 1 (default: 1)
    voice?: string;     // Specific voice name (optional)
}

export interface TTSResult {
    success: boolean;
    message?: string;
    speaking: boolean;
}

/**
 * Check if Speech Synthesis is supported in the browser
 */
export function isTTSSupported(): boolean {
    return 'speechSynthesis' in window;
}

/**
 * Get all available Greek voices
 */
export function getGreekVoices(): SpeechSynthesisVoice[] {
    if (!isTTSSupported()) return [];

    const voices = window.speechSynthesis.getVoices();
    return voices.filter(voice =>
        voice.lang.startsWith('el') ||
        voice.lang.startsWith('gr')
    );
}

/**
 * Get the best available Greek voice
 */
export function getBestGreekVoice(): SpeechSynthesisVoice | null {
    const greekVoices = getGreekVoices();

    if (greekVoices.length === 0) return null;

    // Prefer local voices over network voices
    const localVoice = greekVoices.find(v => v.localService);
    if (localVoice) return localVoice;

    // Return first available Greek voice
    return greekVoices[0];
}

/**
 * Speak Greek text using TTS
 * @param text - Greek text to speak
 * @param options - TTS options (rate, pitch, volume, voice)
 * @returns Promise that resolves when speech starts
 */
export function speakGreek(
    text: string,
    options: GreekTTSOptions = {}
): Promise<TTSResult> {
    return new Promise((resolve) => {
        if (!isTTSSupported()) {
            resolve({
                success: false,
                message: 'Text-to-Speech not supported in this browser',
                speaking: false
            });
            return;
        }

        if (!text || text.trim().length === 0) {
            resolve({
                success: false,
                message: 'No text provided',
                speaking: false
            });
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        // Create utterance
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'el-GR'; // Greek (Greece)
        utterance.rate = options.rate ?? 0.9;  // Slightly slower for clarity
        utterance.pitch = options.pitch ?? 1;
        utterance.volume = options.volume ?? 1;

        // Select voice
        if (options.voice) {
            const voices = window.speechSynthesis.getVoices();
            const selectedVoice = voices.find(v => v.name === options.voice);
            if (selectedVoice) {
                utterance.voice = selectedVoice;
            }
        } else {
            const greekVoice = getBestGreekVoice();
            if (greekVoice) {
                utterance.voice = greekVoice;
            }
        }

        // Event handlers
        utterance.onstart = () => {
            resolve({
                success: true,
                message: 'Speech started',
                speaking: true
            });
        };

        utterance.onerror = (event) => {
            if (event.error === 'canceled' || event.error === 'interrupted') {
                // This is expected when we call window.speechSynthesis.cancel() before starting a new speech
                // 'interrupted' also happens in some browsers when a new speech overrides the old one before it starts.
                resolve({
                    success: false,
                    message: undefined, // Don't trigger error messages for user
                    speaking: false
                });
                return;
            }

            console.error('TTS error:', event);
            resolve({
                success: false,
                message: `TTS error: ${event.error}`,
                speaking: false
            });
        };

        // Speak
        window.speechSynthesis.speak(utterance);
    });
}

/**
 * Stop any ongoing speech
 */
export function stopSpeaking(): void {
    if (isTTSSupported()) {
        window.speechSynthesis.cancel();
    }
}

/**
 * Pause ongoing speech
 */
export function pauseSpeaking(): void {
    if (isTTSSupported()) {
        window.speechSynthesis.pause();
    }
}

/**
 * Resume paused speech
 */
export function resumeSpeaking(): void {
    if (isTTSSupported()) {
        window.speechSynthesis.resume();
    }
}

/**
 * Check if currently speaking
 */
export function isSpeaking(): boolean {
    if (!isTTSSupported()) return false;
    return window.speechSynthesis.speaking;
}

/**
 * Check if speech is paused
 */
export function isPaused(): boolean {
    if (!isTTSSupported()) return false;
    return window.speechSynthesis.paused;
}

/**
 * React hook for Greek TTS
 */
export function useGreekTTS(defaultOptions: GreekTTSOptions = {}) {
    const speak = (text: string, options?: GreekTTSOptions) => {
        return speakGreek(text, { ...defaultOptions, ...options });
    };

    return {
        speak,
        stop: stopSpeaking,
        pause: pauseSpeaking,
        resume: resumeSpeaking,
        isSupported: isTTSSupported(),
        isSpeaking: isSpeaking(),
        isPaused: isPaused(),
        getVoices: getGreekVoices,
        getBestVoice: getBestGreekVoice,
    };
}
