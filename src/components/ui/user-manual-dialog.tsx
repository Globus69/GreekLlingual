"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useAuth } from '@/context/auth-context';
import { useTranslation } from '@/lib/use-translation';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

// Current App/Manual Version – imported from central version file
import { APP_VERSION } from '@/lib/appVersion';

interface UserManualDialogProps {
    isOpen?: boolean; // Controlled externally if needed, but usually automatic
}

export default function UserManualDialog() {
    const { user, loading: authLoading, refreshUser } = useAuth();
    const { t } = useTranslation();
    const [isVisible, setIsVisible] = useState(false);
    const [isAcknowledged, setIsAcknowledged] = useState(false);
    const [hasBeenClosedForSession, setHasBeenClosedForSession] = useState(false);

    useEffect(() => {
        if (!authLoading && user && !hasBeenClosedForSession) {
            // Check if user has seen this version
            const seenVersion = (user as any).acknowledged_manual_version || '0.0.0';

            console.log('🔍 [UserManualDialog] Checking visibility:', {
                user_id: user.id,
                seenVersion,
                APP_VERSION,
                isMatch: seenVersion === APP_VERSION,
                hasBeenClosedForSession
            });

            if (seenVersion !== APP_VERSION) {
                // Show after a slight delay for better UX
                const timer = setTimeout(() => {
                    if (!hasBeenClosedForSession) {
                        console.log('🚀 [UserManualDialog] Showing dialog now');
                        setIsVisible(true);
                    }
                }, 1500);
                return () => clearTimeout(timer);
            } else {
                // Falls Version übereinstimmt (z.B. nach Sync), ausblenden
                console.log('✅ [UserManualDialog] Version matches, keeping hidden');
                setIsVisible(false);
            }
        }
    }, [user, authLoading, hasBeenClosedForSession]);

    const handleClose = async (markAsSeen: boolean) => {
        console.log('🚪 [UserManualDialog] handleClose called, markAsSeen:', markAsSeen);
        setIsVisible(false);
        setHasBeenClosedForSession(true);

        if (markAsSeen && user?.id) {
            // Retry logic: Supabase Free-Tier can be slow to wake up
            const maxRetries = 3;
            for (let attempt = 1; attempt <= maxRetries; attempt++) {
                try {
                    console.log(`📡 [UserManualDialog] Updating metadata in DB... (attempt ${attempt}/${maxRetries})`);
                    const { data: rpcData, error } = await supabase.rpc('update_user_metadata', {
                        p_user_id: user.id,
                        p_manual_version: APP_VERSION
                    });

                    if (error) {
                        console.error(`❌ [UserManualDialog] Error (attempt ${attempt}):`, error);
                        if (attempt < maxRetries) {
                            await new Promise(resolve => setTimeout(resolve, 2000));
                            continue;
                        }
                    } else {
                        console.log('✅ [UserManualDialog] Metadata updated successfully', rpcData);
                        await refreshUser();
                        console.log('🔄 [UserManualDialog] User state refresh complete');
                        break;
                    }
                } catch (err) {
                    console.error(`❌ [UserManualDialog] Network error (attempt ${attempt}):`, err);
                    if (attempt < maxRetries) {
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            }
        }
    };

    if (!isVisible) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 9999,
                    backgroundColor: 'rgba(0, 0, 0, 0.85)',
                    backdropFilter: 'blur(12px)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '24px',
                }}
                onClick={() => handleClose(false)} // Close on background click
            >
                <motion.div
                    initial={{ scale: 0.9, y: 20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.9, y: 20, opacity: 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    style={{
                        width: '94%',
                        maxWidth: '500px',
                        maxHeight: '80vh',
                        background: 'linear-gradient(145deg, rgba(30, 30, 35, 0.98) 0%, rgba(15, 15, 20, 1) 100%)',
                        borderRadius: '24px',
                        border: '1px solid rgba(255, 255, 255, 0.12)',
                        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        flexDirection: 'column',
                        boxSizing: 'border-box'
                    }}
                    onClick={(e) => e.stopPropagation()} // Prevent close on card click
                >
                    {/* Decorative Background Element */}
                    <div style={{
                        position: 'absolute',
                        top: '-50px',
                        right: '-50px',
                        width: '150px',
                        height: '150px',
                        background: 'radial-gradient(circle, rgba(0, 122, 255, 0.12) 0%, transparent 70%)',
                        zIndex: 0
                    }} />

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
                        <div style={{ padding: '24px 24px 16px', flexShrink: 0, textAlign: 'center' }}>
                            <div style={{ fontSize: '42px', marginBottom: '8px' }}>📖</div>
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: '800',
                                color: 'white',
                                lineHeight: '1.2',
                                margin: 0
                            }}>
                                {t('manual.title')}
                            </h2>
                            <div style={{
                                fontSize: '12px',
                                color: 'rgba(0, 122, 255, 0.9)',
                                fontWeight: '700',
                                textTransform: 'uppercase',
                                letterSpacing: '1px',
                                marginTop: '4px'
                            }}>
                                {t('manual.app_name')}
                            </div>
                        </div>

                        {/* Scrollable Content */}
                        <div style={{
                            flex: 1,
                            minHeight: 0,
                            overflowY: 'auto',
                            WebkitOverflowScrolling: 'touch',
                            padding: '0 24px 24px'
                        }}>
                            <div style={{
                                backgroundColor: 'rgba(255, 255, 255, 0.04)',
                                borderRadius: '14px',
                                padding: '14px',
                                marginBottom: '20px',
                                border: '1px solid rgba(255, 255, 255, 0.05)',
                                textAlign: 'center'
                            }}>
                                <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', lineHeight: '1.5', margin: 0 }}>
                                    <b>{t('manual.content_by')}</b><br />
                                    {t('manual.developed_by')}<br />
                                    <span style={{ opacity: 0.5, fontSize: '12px' }}>
                                        {t('manual.version')}: {APP_VERSION}
                                    </span>
                                </p>
                            </div>
                            <div style={{ textAlign: 'left', color: 'rgba(255, 255, 255, 0.9)', fontSize: '14px', lineHeight: '1.6' }}>
                                <ReactMarkdown>{t('manual.content')}</ReactMarkdown>
                            </div>
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
                                {t('btn.close') || 'Schließen'}
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
        </AnimatePresence>
    );
}
