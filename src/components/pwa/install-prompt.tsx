"use client";

import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PWAInstallPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isInstalled, setIsInstalled] = useState(false);

    useEffect(() => {
        // Check if already installed
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        const isIOSStandalone = (window.navigator as any).standalone === true;

        if (isStandalone || isIOSStandalone) {
            setIsInstalled(true);
            return;
        }

        // Listen for beforeinstallprompt event
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();

            // Stash the event so it can be triggered later
            setDeferredPrompt(e as BeforeInstallPromptEvent);

            // Check if user has dismissed this before
            const dismissedDate = localStorage.getItem('pwa-install-dismissed');
            if (dismissedDate) {
                const daysSinceDismissed = (Date.now() - parseInt(dismissedDate)) / (1000 * 60 * 60 * 24);
                // Show again after 7 days
                if (daysSinceDismissed < 7) {
                    return;
                }
            }

            // Show custom install prompt after 3 seconds
            setTimeout(() => {
                setShowPrompt(true);
            }, 3000);
        };

        // Listen for app installed event
        const handleAppInstalled = () => {
            console.log('✅ PWA was installed');
            setIsInstalled(true);
            setShowPrompt(false);
            setDeferredPrompt(null);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        window.addEventListener('appinstalled', handleAppInstalled);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            window.removeEventListener('appinstalled', handleAppInstalled);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) {
            return;
        }

        // Show the install prompt
        await deferredPrompt.prompt();

        // Wait for the user to respond to the prompt
        const choiceResult = await deferredPrompt.userChoice;

        if (choiceResult.outcome === 'accepted') {
            console.log('✅ User accepted the install prompt');
        } else {
            console.log('❌ User dismissed the install prompt');
            // Store dismissal date
            localStorage.setItem('pwa-install-dismissed', Date.now().toString());
        }

        // Clear the deferred prompt
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    };

    // Don't show if already installed or prompt not available
    if (isInstalled || !showPrompt) {
        return null;
    }

    return (
        <>
            {/* Install Prompt Toast */}
            <div className="pwa-install-prompt">
                <div className="prompt-content">
                    <div className="prompt-icon">📱</div>
                    <div className="prompt-text">
                        <div className="prompt-title">Install GreekLingua</div>
                        <div className="prompt-subtitle">
                            Practice offline & get faster access
                        </div>
                    </div>
                    <div className="prompt-actions">
                        <button
                            onClick={handleInstallClick}
                            className="install-btn"
                        >
                            Install
                        </button>
                        <button
                            onClick={handleDismiss}
                            className="dismiss-btn"
                            aria-label="Dismiss"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .pwa-install-prompt {
                    position: fixed;
                    bottom: 20px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 10000;
                    animation: slideUp 0.3s ease-out;
                }

                @keyframes slideUp {
                    from {
                        transform: translateX(-50%) translateY(100px);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(-50%) translateY(0);
                        opacity: 1;
                    }
                }

                .prompt-content {
                    display: flex;
                    align-items: center;
                    gap: 16px;
                    background: rgba(28, 28, 32, 0.98);
                    backdrop-filter: blur(20px);
                    border: 1px solid rgba(102, 126, 234, 0.3);
                    border-radius: 16px;
                    padding: 16px 20px;
                    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5),
                                0 0 0 1px rgba(255, 255, 255, 0.05);
                    min-width: 320px;
                    max-width: 90vw;
                }

                .prompt-icon {
                    font-size: 32px;
                    flex-shrink: 0;
                }

                .prompt-text {
                    flex: 1;
                }

                .prompt-title {
                    font-size: 15px;
                    font-weight: 600;
                    color: #fff;
                    margin-bottom: 2px;
                }

                .prompt-subtitle {
                    font-size: 13px;
                    color: rgba(255, 255, 255, 0.6);
                }

                .prompt-actions {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }

                .install-btn {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    border-radius: 10px;
                    padding: 10px 20px;
                    font-size: 14px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .install-btn:hover {
                    transform: translateY(-1px);
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
                }

                .install-btn:active {
                    transform: translateY(0);
                }

                .dismiss-btn {
                    background: rgba(255, 255, 255, 0.05);
                    color: rgba(255, 255, 255, 0.6);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    width: 32px;
                    height: 32px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 16px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .dismiss-btn:hover {
                    background: rgba(255, 255, 255, 0.1);
                    color: rgba(255, 255, 255, 0.9);
                }

                /* Mobile adjustments */
                @media (max-width: 640px) {
                    .pwa-install-prompt {
                        bottom: 16px;
                        left: 16px;
                        right: 16px;
                        transform: none;
                    }

                    .prompt-content {
                        min-width: unset;
                        width: 100%;
                    }

                    @keyframes slideUp {
                        from {
                            transform: translateY(100px);
                            opacity: 0;
                        }
                        to {
                            transform: translateY(0);
                            opacity: 1;
                        }
                    }
                }
            `}</style>
        </>
    );
}
