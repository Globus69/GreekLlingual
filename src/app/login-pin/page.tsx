"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useLanguage, Locale } from '@/context/language-context';
import { useTranslation } from '@/lib/use-translation';
import { supabase } from '@/db/supabase';

export default function PinLoginPage() {
    const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [shake, setShake] = useState(false);
    const [deviceType, setDeviceType] = useState<'desktop' | 'mobile'>('mobile');
    const [attemptCount, setAttemptCount] = useState(0);
    const [welcomePopup, setWelcomePopup] = useState<{ show: boolean; name: string; level: string; difficulty: string; success: boolean }>({
        show: false,
        name: '',
        level: '',
        difficulty: '',
        success: false,
    });
    const { setUser, user, loading } = useAuth();
    const router = useRouter();
    const { locale, setLocale, syncLocaleFromUser } = useLanguage();
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // If already logged in, redirect to mobile dashboard
    useEffect(() => {
        if (!loading && user) {
            router.push('/m');
        }
    }, [loading, user, router]);

    // Animated background particles
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; hue: number }[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        const hueRange = locale === 'ru'
            ? { base: 345, spread: 30 }
            : locale === 'el'
                ? { base: 190, spread: 30 }
                : locale === 'de'
                    ? { base: 35, spread: 20 }
                    : locale === 'es'
                        ? { base: 0, spread: 20 }
                        : { base: 200, spread: 40 };

        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.4 + 0.1,
                hue: Math.random() * hueRange.spread + hueRange.base,
            });
        }

        const lineColor = locale === 'ru' ? '180, 60, 60' : locale === 'el' ? '13, 110, 253' : locale === 'de' ? '218, 165, 32' : locale === 'es' ? '220, 60, 40' : '0, 122, 255';

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 150) {
                        ctx.beginPath();
                        ctx.strokeStyle = `rgba(${lineColor}, ${0.06 * (1 - dist / 150)})`;
                        ctx.lineWidth = 0.5;
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.stroke();
                    }
                }
            }

            for (const p of particles) {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${p.hue % 360}, 80%, 65%, ${p.opacity})`;
                ctx.fill();

                p.x += p.vx;
                p.y += p.vy;

                if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
                if (p.y < 0 || p.y > canvas.height) p.vy *= -1;
            }

            animationId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, [locale]);

    // Auto-focus first input on mount
    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleClear = () => {
        setPinDigits(['', '', '', '']);
        inputRefs.current[0]?.focus();
    };

    const handleCancel = () => {
        router.push('/login');
    };

    const handleLanguageChange = (lang: Locale) => {
        setLocale(lang);
    };

    // Helper function for progressive delay
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleSubmit = async () => {
        const pin = pinDigits.join('');
        if (pin.length !== 4) {
            setShake(true);
            setTimeout(() => setShake(false), 600);
            return;
        }

        // NOTE: Honeypot checks are handled server-side in verify_user_4digit_pin RPC function
        // Client-side checks removed for security (can be bypassed)
        // Server validates PIN, checks honeypots, and bans IPs automatically

        // Progressive delays: 0ms, 1s, 2s, 5s, 10s
        const delays = [0, 1000, 2000, 5000, 10000];
        const delay = delays[Math.min(attemptCount, delays.length - 1)];

        if (delay > 0) {
            setIsSubmitting(true);
            await sleep(delay);
        }

        setIsSubmitting(true);

        try {
            // Device Fingerprint generieren
            let fingerprint = null;
            try {
                const { getDeviceFingerprint } = await import('@/lib/use-device-fingerprint');
                fingerprint = await getDeviceFingerprint();
            } catch {
                // Ignorieren, Fingerprint ist optional
            }

            // Client-IP holen (Best-Effort, funktioniert nicht bei Proxy/VPN)
            let clientIp = null;
            try {
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 3000); // 3 Sekunden Timeout
                const ipRes = await fetch('https://api.ipify.org?format=json', {
                    signal: controller.signal
                });
                clearTimeout(timeout);
                const ipData = await ipRes.json();
                clientIp = ipData.ip;
            } catch {
                // Ignorieren, IP ist optional (Timeout oder Netzwerkfehler)
            }

            // RPC-Funktion aufrufen (mit Retry bei Cold-Start)
            // Supabase Free-Tier schläft ein und braucht bis zu 15s zum Aufwachen
            let data = null;
            let error = null;
            const maxLoginRetries = 3;

            for (let attempt = 1; attempt <= maxLoginRetries; attempt++) {
                const rpcPromise = supabase.rpc('verify_user_4digit_pin', {
                    p_pin: pin,
                    p_ip_address: clientIp,
                    p_user_agent: navigator.userAgent
                });
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('RPC timeout')), 30000)
                );

                try {
                    const result = await Promise.race([rpcPromise, timeoutPromise]) as any;
                    data = result.data;
                    error = result.error;
                    break;
                } catch (err: any) {
                    if (attempt < maxLoginRetries && err?.message === 'RPC timeout') {
                        console.warn(`⏳ Login attempt ${attempt} timed out, retrying...`);
                        setWelcomePopup({
                            show: true,
                            isError: true,
                            message: `Datenbank wacht auf... (Versuch ${attempt + 1}/${maxLoginRetries})`
                        });
                        await new Promise(r => setTimeout(r, 3000));
                        continue;
                    }
                    throw err;
                }
            }

            if (error) {
                console.error('RPC error:', error);
                throw error;
            }

            if (data && data.length > 0) {
                const userData = data[0];

                // Check: Fehler von RPC (IP banned, Honeypot, Account locked, etc.)
                if (userData.error) {
                    setAttemptCount(prev => prev + 1); // Increment on failure

                    // Spezielle Fehlerbehandlung für verschiedene Fälle
                    let errorLevel = t('error.pin_not_found');
                    if (userData.error === 'IP banned') {
                        errorLevel = t('error.ip_banned');
                    } else if (userData.error === 'Account locked. Try again later.') {
                        errorLevel = t('error.account_locked');
                    }

                    setWelcomePopup({
                        show: true,
                        name: t('error.title'),
                        level: errorLevel,
                        difficulty: '',
                        success: false
                    });
                    setPinDigits(['', '', '', '']);
                    setShake(true);
                    setTimeout(() => {
                        setWelcomePopup({ show: false, name: '', level: '', difficulty: '', success: false });
                        setShake(false);
                    }, 2000);

                    // Record failed attempt für Account Lockout (falls PIN bekannt ist)
                    if (userData.error !== 'IP banned') {
                        supabase.rpc('record_failed_login_attempt', { p_pin: pin })
                            .then(({ data, error }) => {
                                if (error) console.warn('Failed attempt recording failed:', error);
                                if (data?.locked) {
                                    console.warn('Account locked after 5 failed attempts:', data);
                                }
                            });
                    }

                    return;
                }

                // Device-Typ in Datenbank speichern (fire-and-forget)
                // Note: Requires migration 010_add_device_type_tracking.sql to be executed
                supabase.rpc('update_user_device', {
                    p_user_id: userData.user_id,
                    p_device_type: deviceType
                }).then(({ error }) => {
                    // Silently ignore if function doesn't exist (migration not yet applied)
                    if (error && error.code !== 'PGRST202') {
                        console.warn('Device update failed:', error);
                    }
                });

                // Fingerprint speichern (falls neu oder geändert)
                if (fingerprint) {
                    supabase.rpc('update_user_metadata', {
                        p_user_id: userData.user_id,
                        p_fingerprint: fingerprint
                    }).then(({ error }) => {
                        if (error) console.warn('Fingerprint update failed:', error);
                    });
                }

                // User einloggen (über den bestehenden AuthContext)
                const userObject = {
                    id: userData.user_id,
                    name: userData.user_name,
                    email: userData.user_email,
                    role: userData.user_role,
                    level: userData.user_level,
                    difficulty: userData.user_difficulty,
                    performance_index: userData.user_performance_index,
                    preferred_locale: userData.user_preferred_locale,
                    acknowledged_manual_version: userData.user_acknowledged_manual_version,
                    acknowledged_swipe_tutorial_version: userData.user_acknowledged_swipe_tutorial_version,
                };

                localStorage.setItem('greeklingua_user', JSON.stringify(userObject));
                localStorage.setItem('greeklingua_session_ts', Date.now().toString());

                // CRITICAL: Update AuthContext so dashboard doesn't redirect back to login
                setUser(userObject);

                // Sync UI language from user profile (auto-detect locale)
                syncLocaleFromUser(userData.user_preferred_locale);

                // Reset attempt counter on success
                setAttemptCount(0);

                // Welcome-Popup anzeigen (1.5 Sekunden) + direkter Login
                setWelcomePopup({
                    show: true,
                    name: userData.user_name,
                    level: userData.user_level,
                    difficulty: userData.user_difficulty,
                    success: true
                });

                // Nach 1.5 Sekunden: Redirect zum Mobile Dashboard
                setTimeout(() => {
                    router.push('/m');
                }, 1500);
            } else {
                // PIN nicht gefunden - modernes Popup
                setAttemptCount(prev => prev + 1); // Increment on failure
                setWelcomePopup({
                    show: true,
                    name: t('error.title'),
                    level: t('error.pin_not_found'),
                    difficulty: '',
                    success: false
                });
                setPinDigits(['', '', '', '']);
                setShake(true);
                setTimeout(() => {
                    setWelcomePopup({ show: false, name: '', level: '', difficulty: '', success: false });
                    setShake(false);
                }, 2000);
            }
        } catch (error) {
            console.error('Login error:', error);
            setAttemptCount(prev => prev + 1); // Increment on failure
            setWelcomePopup({
                show: true,
                name: t('error.title'),
                level: t('error.pin_not_found'),
                difficulty: '',
                success: false
            });
            setPinDigits(['', '', '', '']);
            setShake(true);
            setTimeout(() => {
                setWelcomePopup({ show: false, name: '', level: '', difficulty: '', success: false });
                setShake(false);
            }, 2000);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isFull = pinDigits.every(d => d !== '');

    return (
        <>
            <style jsx global>{`
                @keyframes loginFadeIn {
                    from { opacity: 0; transform: translateY(30px) scale(0.95); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }
                @keyframes loginShake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
                    20%, 40%, 60%, 80% { transform: translateX(4px); }
                }
                @keyframes orbFloat1 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -40px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.95); }
                }
                @keyframes orbFloat2 {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(-40px, 30px) scale(0.9); }
                    66% { transform: translate(25px, -25px) scale(1.05); }
                }
            `}</style>

            <div style={{
                position: 'fixed',
                inset: 0,
                background: locale === 'ru'
                    ? 'radial-gradient(ellipse at 50% 50%, #3d1535 0%, #1a0818 50%, #0A0A0C 100%)'
                    : locale === 'el'
                        ? 'radial-gradient(ellipse at 50% 50%, #0d2847 0%, #091a35 50%, #0A0A0C 100%)'
                        : locale === 'de'
                            ? 'radial-gradient(ellipse at 50% 50%, #3d3010 0%, #1a1508 50%, #0A0A0C 100%)'
                            : locale === 'es'
                                ? 'radial-gradient(ellipse at 50% 50%, #3d1015 0%, #1a0808 50%, #0A0A0C 100%)'
                                : 'radial-gradient(ellipse at 50% 50%, #0f2555 0%, #0a1230 50%, #0A0A0C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                transition: 'background 0.6s ease',
            }}>
                <canvas
                    ref={canvasRef}
                    style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                />

                {/* Header Area – Top Bar with Role Switch and Language Selector */}
                <div style={{
                    position: 'absolute',
                    top: '40px', // Increased spacing from edge
                    left: '24px',
                    right: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    zIndex: 10,
                }}>
                    {/* Role Switch – Compact Version (Steps 2-3) */}
                    <div style={{
                        display: 'flex',
                        background: 'rgba(28, 28, 30, 0.7)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        borderRadius: '12px',
                        padding: '4px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    }}>
                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: 'transparent',
                                color: '#8E8E93',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                            }}
                        >
                            👨‍💼 Admin
                        </button>
                        <button
                            type="button"
                            onClick={() => setDeviceType('mobile')}
                            style={{
                                padding: '6px 12px',
                                borderRadius: '8px',
                                border: 'none',
                                background: deviceType === 'mobile'
                                    ? 'linear-gradient(135deg, #007AFF, #5856D6)'
                                    : 'transparent',
                                color: deviceType === 'mobile' ? '#fff' : '#8E8E93',
                                fontSize: '12px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                boxShadow: deviceType === 'mobile' ? '0 2px 8px rgba(0, 122, 255, 0.3)' : 'none',
                            }}
                        >
                            👤 User
                        </button>
                    </div>

                    {/* Language Selector (Step 4) */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        background: 'rgba(28, 28, 30, 0.7)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        borderRadius: '14px',
                        padding: '4px 6px 4px 12px',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    }}>
                        <span style={{ fontSize: '12px' }}>🌐</span>
                        <div style={{
                            display: 'flex',
                            gap: '2px',
                        }}>
                            {(['en', 'ru', 'de', 'es'] as Locale[]).map((lang) => {
                                const isSelected = locale === lang;
                                return (
                                    <button
                                        key={lang}
                                        type="button"
                                        onClick={() => handleLanguageChange(lang)}
                                        style={{
                                            padding: '6px 10px',
                                            borderRadius: '8px',
                                            border: 'none',
                                            background: isSelected ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                                            color: isSelected ? '#fff' : '#8E8E93',
                                            fontSize: '11px',
                                            fontWeight: 700,
                                            cursor: 'pointer',
                                            transition: 'all 0.2s',
                                            textTransform: 'uppercase',
                                        }}
                                    >
                                        {lang}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div style={{
                    position: 'absolute',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: locale === 'ru'
                        ? 'radial-gradient(circle, rgba(224, 85, 85, 0.18) 0%, transparent 70%)'
                        : locale === 'el'
                            ? 'radial-gradient(circle, rgba(13, 110, 253, 0.18) 0%, transparent 70%)'
                            : locale === 'de'
                                ? 'radial-gradient(circle, rgba(218, 165, 32, 0.18) 0%, transparent 70%)'
                                : locale === 'es'
                                    ? 'radial-gradient(circle, rgba(220, 60, 40, 0.18) 0%, transparent 70%)'
                                    : 'radial-gradient(circle, rgba(0, 122, 255, 0.18) 0%, transparent 70%)',
                    top: '-100px',
                    right: '-100px',
                    animation: 'orbFloat1 12s ease-in-out infinite',
                    pointerEvents: 'none',
                    transition: 'background 0.6s ease',
                }} />
                <div style={{
                    position: 'absolute',
                    width: '400px',
                    height: '400px',
                    borderRadius: '50%',
                    background: locale === 'ru'
                        ? 'radial-gradient(circle, rgba(180, 60, 60, 0.15) 0%, transparent 70%)'
                        : locale === 'el'
                            ? 'radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%)'
                            : locale === 'de'
                                ? 'radial-gradient(circle, rgba(180, 140, 20, 0.15) 0%, transparent 70%)'
                                : locale === 'es'
                                    ? 'radial-gradient(circle, rgba(180, 60, 40, 0.15) 0%, transparent 70%)'
                                    : 'radial-gradient(circle, rgba(88, 86, 214, 0.15) 0%, transparent 70%)',
                    bottom: '-80px',
                    left: '-80px',
                    animation: 'orbFloat2 15s ease-in-out infinite',
                    pointerEvents: 'none',
                    transition: 'background 0.6s ease',
                }} />

                {/* Login Card */}
                <div
                    style={{
                        position: 'relative',
                        zIndex: 5,
                        width: '420px',
                        maxWidth: '92vw',
                        background: 'rgba(22, 22, 26, 0.75)',
                        backdropFilter: 'blur(60px) saturate(1.5)',
                        WebkitBackdropFilter: 'blur(60px) saturate(1.5)',
                        borderRadius: '32px',
                        padding: '48px 40px 40px',
                        border: '1px solid rgba(255, 255, 255, 0.08)',
                        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.03) inset',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        animation: shake ? 'loginShake 0.6s ease-in-out' : 'loginFadeIn 0.8s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    }}
                >
                    {/* Logo */}
                    <div style={{
                        fontSize: '56px',
                        marginBottom: '8px',
                        filter: 'drop-shadow(0 0 24px rgba(0, 122, 255, 0.3))',
                    }}>
                        🔐
                    </div>

                    {/* Title */}
                    <h1 style={{
                        fontSize: '26px',
                        fontWeight: 800,
                        color: '#fff',
                        margin: '0 0 4px 0',
                        letterSpacing: '-0.5px',
                    }}>
                        {t('login_pin.title')}
                    </h1>

                    <p style={{
                        fontSize: '14px',
                        color: '#A8A8AD', // Aufgehellt von #6E6E73
                        margin: '0 0 24px 0',
                        textAlign: 'center',
                        lineHeight: '1.5',
                    }}>
                        {t('login_pin.subtitle')}
                    </p>



                    {/* PIN Display Fields - Read-only, no native keyboard */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '24px',
                    }}>
                        {pinDigits.map((digit, index) => (
                            <div
                                key={index}
                                style={{
                                    width: '64px',
                                    height: '72px',
                                    background: digit
                                        ? 'rgba(0, 122, 255, 0.12)'
                                        : 'rgba(0, 0, 0, 0.3)',
                                    border: `2px solid ${digit
                                        ? 'rgba(0, 122, 255, 0.4)'
                                        : 'rgba(255, 255, 255, 0.08)'}`,
                                    borderRadius: '16px',
                                    fontSize: '32px',
                                    fontWeight: 700,
                                    color: '#fff',
                                    textAlign: 'center',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                    boxShadow: digit ? '0 4px 16px rgba(0, 122, 255, 0.2)' : 'none',
                                }}
                            >
                                {digit || ''}
                            </div>
                        ))}
                    </div>

                    {/* Button Numpad */}
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, 1fr)',
                        gap: '12px',
                        marginBottom: '24px',
                        maxWidth: '280px',
                        margin: '0 auto 24px',
                    }}>
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                            <button
                                key={num}
                                type="button"
                                onClick={() => {
                                    const firstEmpty = pinDigits.findIndex(d => d === '');
                                    if (firstEmpty !== -1) {
                                        const newDigits = [...pinDigits];
                                        newDigits[firstEmpty] = String(num);
                                        setPinDigits(newDigits);
                                    }
                                }}
                                disabled={isSubmitting || pinDigits.every(d => d !== '')}
                                style={{
                                    background: 'rgba(255, 255, 255, 0.08)',
                                    border: '1px solid rgba(255, 255, 255, 0.12)',
                                    borderRadius: '16px',
                                    padding: '20px',
                                    fontSize: '24px',
                                    fontWeight: 600,
                                    color: '#fff',
                                    cursor: (isSubmitting || pinDigits.every(d => d !== '')) ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    opacity: (isSubmitting || pinDigits.every(d => d !== '')) ? 0.4 : 1,
                                }}
                                onTouchStart={(e) => {
                                    if (!isSubmitting && !pinDigits.every(d => d !== '')) {
                                        e.currentTarget.style.background = 'rgba(0, 122, 255, 0.2)';
                                        e.currentTarget.style.transform = 'scale(0.95)';
                                    }
                                }}
                                onTouchEnd={(e) => {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                {num}
                            </button>
                        ))}

                        {/* Delete Button */}
                        <button
                            type="button"
                            onClick={() => {
                                const lastFilled = pinDigits.map((d, i) => d !== '' ? i : -1).filter(i => i !== -1).pop();
                                if (lastFilled !== undefined) {
                                    const newDigits = [...pinDigits];
                                    newDigits[lastFilled] = '';
                                    setPinDigits(newDigits);
                                }
                            }}
                            disabled={isSubmitting || pinDigits.every(d => d === '')}
                            style={{
                                background: 'rgba(255, 69, 58, 0.1)',
                                border: '1px solid rgba(255, 69, 58, 0.3)',
                                borderRadius: '16px',
                                padding: '20px',
                                fontSize: '20px',
                                color: '#FF453A',
                                cursor: (isSubmitting || pinDigits.every(d => d === '')) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: (isSubmitting || pinDigits.every(d => d === '')) ? 0.4 : 1,
                            }}
                            onTouchStart={(e) => {
                                if (!isSubmitting && !pinDigits.every(d => d === '')) {
                                    e.currentTarget.style.background = 'rgba(255, 69, 58, 0.25)';
                                    e.currentTarget.style.transform = 'scale(0.95)';
                                }
                            }}
                            onTouchEnd={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 69, 58, 0.1)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            ⌫
                        </button>

                        {/* 0 Button */}
                        <button
                            type="button"
                            onClick={() => {
                                const firstEmpty = pinDigits.findIndex(d => d === '');
                                if (firstEmpty !== -1) {
                                    const newDigits = [...pinDigits];
                                    newDigits[firstEmpty] = '0';
                                    setPinDigits(newDigits);
                                }
                            }}
                            disabled={isSubmitting || pinDigits.every(d => d !== '')}
                            style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '16px',
                                padding: '20px',
                                fontSize: '24px',
                                fontWeight: 600,
                                color: '#fff',
                                cursor: (isSubmitting || pinDigits.every(d => d !== '')) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: (isSubmitting || pinDigits.every(d => d !== '')) ? 0.4 : 1,
                            }}
                            onTouchStart={(e) => {
                                if (!isSubmitting && !pinDigits.every(d => d !== '')) {
                                    e.currentTarget.style.background = 'rgba(0, 122, 255, 0.2)';
                                    e.currentTarget.style.transform = 'scale(0.95)';
                                }
                            }}
                            onTouchEnd={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            0
                        </button>

                        {/* Clear Button moved here */}
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={pinDigits.every(d => !d) || isSubmitting}
                            style={{
                                background: 'rgba(255, 255, 255, 0.08)',
                                border: '1px solid rgba(255, 255, 255, 0.12)',
                                borderRadius: '16px',
                                padding: '10px',
                                fontSize: '14px',
                                fontWeight: 700,
                                color: '#fff',
                                cursor: (pinDigits.every(d => !d) || isSubmitting) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: (pinDigits.every(d => !d) || isSubmitting) ? 0.4 : 1,
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                            }}
                            onTouchStart={(e) => {
                                if (!isSubmitting && !pinDigits.every(d => !d)) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)';
                                    e.currentTarget.style.transform = 'scale(0.95)';
                                }
                            }}
                            onTouchEnd={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.08)';
                                e.currentTarget.style.transform = 'scale(1)';
                            }}
                        >
                            Clear
                        </button>
                    </div>



                    {/* Action Buttons */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        width: '100%',
                    }}>
                        <button
                            type="button"
                            onClick={handleCancel}
                            disabled={isSubmitting}
                            style={{
                                flex: 1,
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '16px',
                                padding: '16px',
                                fontSize: '15px',
                                fontWeight: 600,
                                color: '#fff',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                opacity: isSubmitting ? 0.4 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!isSubmitting) {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                            }}
                        >
                            Abbrechen
                        </button>

                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={!isFull || isSubmitting}
                            style={{
                                flex: 1,
                                background: (!isFull || isSubmitting)
                                    ? 'rgba(0, 122, 255, 0.3)'
                                    : 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                                border: 'none',
                                borderRadius: '16px',
                                padding: '16px',
                                fontSize: '15px',
                                fontWeight: 700,
                                color: 'white',
                                cursor: (!isFull || isSubmitting) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s',
                                boxShadow: (!isFull || isSubmitting)
                                    ? 'none'
                                    : '0 8px 32px rgba(0, 122, 255, 0.4)',
                            }}
                            onMouseEnter={(e) => {
                                if (isFull && !isSubmitting) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 44px rgba(0, 122, 255, 0.6)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = (!isFull || isSubmitting)
                                    ? 'none'
                                    : '0 8px 32px rgba(0, 122, 255, 0.4)';
                            }}
                        >
                            {isSubmitting ? '...' : 'Anmelden'}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div style={{
                    position: 'absolute',
                    bottom: '24px',
                    color: '#2C2C2E',
                    fontSize: '11px',
                    fontWeight: 500,
                    letterSpacing: '2px',
                    textTransform: 'uppercase',
                    zIndex: 5,
                }}>
                    HellenicHorizons © {new Date().getFullYear()}
                </div>

                {/* Welcome Popup - Glasmorphismus Design */}
                {welcomePopup.show && (
                    <div style={{
                        position: 'fixed',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 9999,
                        animation: 'fadeIn 0.2s ease-out',
                    }}>
                        {/* Backdrop */}
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(4px)',
                            WebkitBackdropFilter: 'blur(4px)',
                        }} />

                        {/* Popup Card */}
                        <div style={{
                            position: 'relative',
                            width: '380px',
                            maxWidth: '90vw',
                            background: welcomePopup.success === false
                                ? 'rgba(40, 20, 20, 0.85)'
                                : 'rgba(22, 22, 26, 0.85)',
                            backdropFilter: 'blur(40px) saturate(1.8)',
                            WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
                            borderRadius: '28px',
                            padding: '40px 32px',
                            border: welcomePopup.success
                                ? '1px solid rgba(0, 122, 255, 0.3)'
                                : '1px solid rgba(255, 69, 58, 0.3)',
                            boxShadow: welcomePopup.success
                                ? '0 24px 60px rgba(0, 122, 255, 0.4), 0 0 0 1px rgba(0, 122, 255, 0.1) inset'
                                : '0 24px 60px rgba(255, 69, 58, 0.3), 0 0 0 1px rgba(255, 69, 58, 0.1) inset',
                            textAlign: 'center',
                            animation: 'popIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        }}>
                            {/* Icon */}
                            <div style={{
                                fontSize: '56px',
                                marginBottom: '16px',
                                filter: welcomePopup.success
                                    ? 'drop-shadow(0 0 20px rgba(0, 122, 255, 0.5))'
                                    : 'drop-shadow(0 0 20px rgba(255, 69, 58, 0.5))',
                            }}>
                                {welcomePopup.success ? '✅' : '❌'}
                            </div>

                            {/* Title */}
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: 800,
                                color: '#fff',
                                margin: '0 0 8px 0',
                                letterSpacing: '-0.5px',
                            }}>
                                {welcomePopup.success ? `Willkommen, ${welcomePopup.name}!` : welcomePopup.name}
                            </h2>

                            {/* Info */}
                            {welcomePopup.success && (
                                <div style={{
                                    display: 'flex',
                                    gap: '12px',
                                    justifyContent: 'center',
                                    marginTop: '20px',
                                }}>
                                    <div style={{
                                        background: 'rgba(88, 86, 214, 0.15)',
                                        border: '1px solid rgba(88, 86, 214, 0.3)',
                                        borderRadius: '12px',
                                        padding: '8px 16px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#A29BFE',
                                    }}>
                                        Stufe: {welcomePopup.level}
                                    </div>
                                    <div style={{
                                        background: 'rgba(52, 199, 89, 0.15)',
                                        border: '1px solid rgba(52, 199, 89, 0.3)',
                                        borderRadius: '12px',
                                        padding: '8px 16px',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                        color: '#5DD689',
                                        textTransform: 'capitalize',
                                    }}>
                                        {welcomePopup.difficulty}
                                    </div>
                                </div>
                            )}

                            {/* Error Message */}
                            {!welcomePopup.success && (
                                <p style={{
                                    fontSize: '15px',
                                    color: '#FF6B6B',
                                    margin: '12px 0 0 0',
                                    fontWeight: 500,
                                }}>
                                    {welcomePopup.level}
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Animations */}
            <style jsx global>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes popIn {
                    0% { opacity: 0; transform: scale(0.8) translateY(20px); }
                    100% { opacity: 1; transform: scale(1) translateY(0); }
                }
            `}</style>
        </>
    );
}
