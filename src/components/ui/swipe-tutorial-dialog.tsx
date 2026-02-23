"use client";

import React, { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/use-translation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { APP_VERSION } from '@/lib/appVersion';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/auth-context';

interface SwipeTutorialDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function SwipeTutorialDialog({ isOpen, onClose }: SwipeTutorialDialogProps) {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const { t } = useTranslation();
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [hasBeenClosedForSession, setHasBeenClosedForSession] = useState(false);

    const handleClose = async (markAsSeen: boolean) => {
        console.log('🚪 [SwipeTutorialDialog] handleClose called, markAsSeen:', markAsSeen);
        setHasBeenClosedForSession(true);
        onClose();

        if (markAsSeen && user?.id) {
            const maxRetries = 3;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`📡 [SwipeTutorialDialog] Updating metadata... (attempt ${attempt}/${maxRetries})`);
                    const { error } = await supabase.rpc('update_user_metadata', {
                        p_user_id: user.id,
                        p_swipe_version: APP_VERSION
                    });

                    if (error) {
                        console.error(`❌ [SwipeTutorialDialog] Error (attempt ${attempt}):`, error);
                        if (attempt < maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            continue;
                        }
                    } else {
                        console.log('✅ [SwipeTutorialDialog] Metadata updated, refreshing user state...');
                        await refreshUser();
                        break;
                    }
                } catch (err) {
                    console.error(`❌ [SwipeTutorialDialog] Network error (attempt ${attempt}):`, err);
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
        }
    };

    // Auto-close if user has already seen this version in DB
    useEffect(() => {
        if (isOpen && !authLoading && user) {
            const seenVersion = (user as any).acknowledged_swipe_tutorial_version || '0.0.0';

            console.log('🔍 [SwipeTutorialDialog] Checking visibility:', {
                isOpen,
                seenVersion,
                APP_VERSION,
                isMatch: seenVersion === APP_VERSION,
                hasBeenClosedForSession
            });

            if (seenVersion === APP_VERSION || hasBeenClosedForSession) {
                console.log('✅ [SwipeTutorialDialog] Auto-closing (already seen or closed in session)');
                onClose();
            }
        }
    }, [isOpen, user, authLoading, hasBeenClosedForSession, onClose]);

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 10001,
                        backgroundColor: 'rgba(0, 0, 0, 0.85)',
                        backdropFilter: 'blur(12px)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '20px',
                    }}
                    onClick={() => handleClose(false)} // Close on overlay click
                >
                    <motion.div
                        initial={{ scale: 0.9, y: 20, opacity: 0 }}
                        animate={{ scale: 1, y: 0, opacity: 1 }}
                        exit={{ scale: 0.9, y: 20, opacity: 0 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        style={{
                            width: '92%',
                            maxWidth: '400px',
                            maxHeight: '80vh',
                            background: 'linear-gradient(145deg, rgba(30, 30, 35, 0.98) 0%, rgba(15, 15, 20, 1) 100%)',
                            borderRadius: '24px',
                            border: '1px solid rgba(255, 255, 255, 0.12)',
                            boxShadow: '0 20px 60px -10px rgba(0, 0, 0, 0.7)',
                            position: 'relative',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            boxSizing: 'border-box'
                        }}
                        onClick={(e) => e.stopPropagation()} // Prevent close on card click
                    >
                        <div style={{
                            position: 'relative',
                            zIndex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            height: '100%',
                            maxHeight: 'inherit',
                            flex: 1,
                            minHeight: 0
                        }}>
                            {/* Header */}
                            <div style={{ padding: '24px 24px 12px', flexShrink: 0, textAlign: 'center' }}>
                                <div style={{ fontSize: '40px', marginBottom: '8px' }}>👆</div>
                                <h2 style={{
                                    fontSize: '20px',
                                    fontWeight: '800',
                                    color: 'white',
                                    lineHeight: '1.2',
                                    margin: 0
                                }}>
                                    {t('tutorial.swipe.title')}
                                </h2>
                            </div>

                            {/* Scrollable Content */}
                            <div style={{
                                textAlign: 'left',
                                color: 'rgba(255, 255, 255, 0.9)',
                                fontSize: '14px',
                                lineHeight: '1.6',
                                flex: 1,
                                minHeight: 0,
                                overflowY: 'auto',
                                WebkitOverflowScrolling: 'touch', // For Safari
                                padding: '0 24px 20px',
                            }}
                            >
                                <ReactMarkdown>{t('tutorial.swipe.content')}</ReactMarkdown>
                            </div>

                            {/* Footer */}
                            <div style={{ padding: '20px 24px 24px', flexShrink: 0, borderTop: '1px solid rgba(255, 255, 255, 0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
                                <button
                                    onClick={() => handleClose(isAcknowledged)}
                                    style={{
                                        width: '100%',
                                        padding: '14px',
                                        borderRadius: '14px',
                                        background: '#007AFF',
                                        color: 'white',
                                        border: 'none',
                                        fontSize: '16px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        marginBottom: '14px',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 12px rgba(0, 122, 255, 0.3)'
                                    }}
                                >
                                    {t('btn.close') || 'Alles klar, verstanden!'}
                                </button>

                                <div
                                    style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        gap: '10px',
                                        padding: '10px',
                                        cursor: 'pointer',
                                        borderRadius: '10px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.03)',
                                        border: '1px solid rgba(255, 255, 255, 0.08)',
                                    }}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        const nextState = !isAcknowledged;
                                        setIsAcknowledged(nextState);
                                        if (nextState) {
                                            setTimeout(() => handleClose(true), 400);
                                        }
                                    }}
                                >
                                    <div style={{
                                        width: '20px',
                                        height: '20px',
                                        borderRadius: '5px',
                                        border: `2px solid ${isAcknowledged ? '#007AFF' : 'rgba(255, 255, 255, 0.3)'}`,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        backgroundColor: isAcknowledged ? '#007AFF' : 'transparent',
                                    }}>
                                        {isAcknowledged && <span style={{ color: 'white', fontWeight: 'bold', fontSize: '12px' }}>✓</span>}
                                    </div>
                                    <span style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '13px', fontWeight: '500' }}>
                                        {t('manual.dont_show_again') || 'Nicht mehr anzeigen'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
