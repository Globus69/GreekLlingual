"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/language-context';
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
    const { setUser, user } = useAuth();
    const router = useRouter();
    const { locale, syncLocaleFromUser } = useLanguage();
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

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

        const lineColor = locale === 'ru' ? '180, 60, 60' : locale === 'el' ? '13, 110, 253' : locale === 'de' ? '218, 165, 32' : '0, 122, 255';

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

    // Helper function for progressive delay
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    const handleSubmit = async () => {
        const pin = pinDigits.join('');
        if (pin.length !== 4) {
            setShake(true);
            setTimeout(() => setShake(false), 600);
            return;
        }

        // Honeypot-Check (Client-seitig)
        const HONEYPOT_PINS = new Set([
            '0000', '1111', '2222', '3333', '4444', '5555', '6666', '7777', '8888', '9999',
            '1234', '4321', '1122', '2211', '5678'
        ]);

        if (HONEYPOT_PINS.has(pin)) {
            // Honeypot-PIN erkannt! Telegram-Alert senden (via API-Route = server-seitig, kein CORS)
            console.log('🍯 Honeypot-PIN detected:', pin);
            try {
                const alertResponse = await fetch('/api/honeypot-alert', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ pin })
                });
                const alertData = await alertResponse.json();
                console.log('📱 Telegram alert sent:', alertData);
            } catch (error) {
                console.error('❌ Telegram alert failed:', error);
            }

            // Zeige Fehler-Popup
            setAttemptCount(prev => prev + 1);
            setWelcomePopup({
                show: true,
                name: '⚠️ Sicherheitswarnung',
                level: 'Ungültiger PIN',
                difficulty: '',
                success: false
            });
            setTimeout(() => {
                setWelcomePopup({ show: false, name: '', level: '', difficulty: '', success: false });
                setPinDigits(['', '', '', '']);
                inputRefs.current[0]?.focus();
            }, 2000);
            setIsSubmitting(false);
            return;
        }

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

            // RPC-Funktion aufrufen (mit 10 Sekunden Timeout)
            const rpcPromise = supabase.rpc('verify_user_4digit_pin', {
                p_pin: pin,
                p_ip_address: clientIp,
                p_user_agent: navigator.userAgent
            });
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('RPC timeout')), 10000)
            );
            const { data, error } = await Promise.race([rpcPromise, timeoutPromise]) as any;

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
                    let errorLevel = 'PIN nicht gefunden';
                    if (userData.error === 'IP banned') {
                        errorLevel = 'IP gesperrt - Verdächtige Aktivität';
                    } else if (userData.error === 'Account locked. Try again later.') {
                        errorLevel = 'Account gesperrt - 15 Min. warten';
                    }

                    setWelcomePopup({
                        show: true,
                        name: 'Fehler',
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
                supabase.rpc('update_user_device', {
                    p_user_id: userData.user_id,
                    p_device_type: deviceType
                }).then(({ error }) => {
                    if (error) console.warn('Device update failed:', error);
                });

                // Fingerprint speichern (falls neu oder geändert)
                if (fingerprint) {
                    supabase.from('users').update({
                        device_fingerprint: fingerprint
                    }).eq('id', userData.user_id).then(({ error }) => {
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

                // Nach 1.5 Sekunden: Redirect zum Dashboard
                setTimeout(() => {
                    router.push('/dashboard');
                }, 1500);
            } else {
                // PIN nicht gefunden - modernes Popup
                setAttemptCount(prev => prev + 1); // Increment on failure
                setWelcomePopup({
                    show: true,
                    name: 'Fehler',
                    level: 'PIN nicht gefunden',
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
                name: 'Fehler',
                level: 'PIN nicht gefunden',
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

                {/* Admin-Login Button - Top Right */}
                <button
                    type="button"
                    onClick={() => router.push('/login')}
                    style={{
                        position: 'absolute',
                        top: '24px',
                        right: '24px',
                        background: 'rgba(255, 255, 255, 0.06)',
                        backdropFilter: 'blur(30px)',
                        WebkitBackdropFilter: 'blur(30px)',
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                        borderRadius: '12px',
                        padding: '10px 18px',
                        fontSize: '13px',
                        fontWeight: 600,
                        color: '#FFD700',
                        cursor: 'pointer',
                        transition: 'all 0.3s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        zIndex: 10,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 215, 0, 0.15)';
                        e.currentTarget.style.borderColor = 'rgba(255, 215, 0, 0.3)';
                        e.currentTarget.style.transform = 'translateY(-2px)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                        e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                        e.currentTarget.style.transform = 'translateY(0)';
                    }}
                >
                    <span style={{ fontSize: '16px' }}>👤</span>
                    Admin
                </button>

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
                                : 'radial-gradient(circle, rgba(0, 122, 255, 0.18) 0%, transparent 70%)',
                    top: '-100px',
                    right: '-100px',
                    animation: 'orbFloat1 12s ease-in-out infinite',
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
                        background: 'rgba(42, 42, 48, 0.85)', // Aufgehellt von rgba(22, 22, 26, 0.75)
                        backdropFilter: 'blur(60px) saturate(1.5)',
                        WebkitBackdropFilter: 'blur(60px) saturate(1.5)',
                        borderRadius: '32px',
                        padding: '48px 40px 40px',
                        border: '1px solid rgba(255, 255, 255, 0.12)', // Aufgehellt von 0.08
                        boxShadow: '0 24px 80px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.06) inset', // Aufgehellt
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
                        PIN-Login
                    </h1>

                    <p style={{
                        fontSize: '14px',
                        color: '#A8A8AD', // Aufgehellt von #6E6E73
                        margin: '0 0 24px 0',
                        textAlign: 'center',
                        lineHeight: '1.5',
                    }}>
                        Geben Sie Ihren 4-stelligen PIN ein
                    </p>

                    {/* Login Type Selection */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '24px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '16px',
                        padding: '6px',
                    }}>
                        <button
                            type="button"
                            onClick={() => router.push('/login')}
                            style={{
                                flex: 1,
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                background: 'transparent',
                                color: '#8E8E93',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'transparent';
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>👨‍💼</span>
                            Admin
                        </button>

                        <button
                            type="button"
                            onClick={() => setDeviceType('mobile')}
                            style={{
                                flex: 1,
                                padding: '10px 20px',
                                borderRadius: '12px',
                                border: 'none',
                                background: deviceType === 'mobile'
                                    ? 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)'
                                    : 'transparent',
                                color: deviceType === 'mobile' ? '#fff' : '#8E8E93',
                                fontSize: '13px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '6px',
                                boxShadow: deviceType === 'mobile'
                                    ? '0 2px 8px rgba(0, 122, 255, 0.3)'
                                    : 'none',
                            }}
                            onMouseEnter={(e) => {
                                if (deviceType !== 'mobile') {
                                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                if (deviceType !== 'mobile') {
                                    e.currentTarget.style.background = 'transparent';
                                }
                            }}
                        >
                            <span style={{ fontSize: '16px' }}>👤</span>
                            User
                        </button>
                    </div>

                    {/* PIN Input Fields - Native Keyboard */}
                    <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '32px',
                    }}>
                        {pinDigits.map((digit, index) => (
                            <input
                                key={index}
                                ref={(el) => { inputRefs.current[index] = el; }}
                                type="tel"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                disabled={isSubmitting}
                                onChange={(e) => {
                                    const value = e.target.value.replace(/[^0-9]/g, '');
                                    if (value.length <= 1) {
                                        const newDigits = [...pinDigits];
                                        newDigits[index] = value;
                                        setPinDigits(newDigits);

                                        // Auto-advance to next input
                                        if (value && index < 3) {
                                            inputRefs.current[index + 1]?.focus();
                                        }
                                    }
                                }}
                                onKeyDown={(e) => {
                                    // Handle backspace
                                    if (e.key === 'Backspace' && !digit && index > 0) {
                                        inputRefs.current[index - 1]?.focus();
                                    }
                                    // Submit on Enter
                                    if (e.key === 'Enter' && isFull) {
                                        handleSubmit();
                                    }
                                }}
                                onFocus={(e) => e.target.select()}
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
                                    transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                    boxShadow: digit ? '0 4px 16px rgba(0, 122, 255, 0.2)' : 'none',
                                    outline: 'none',
                                    caretColor: 'transparent',
                                }}
                            />
                        ))}
                    </div>

                    {/* Clear Button */}
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginBottom: '24px',
                    }}>
                        <button
                            type="button"
                            onClick={handleClear}
                            disabled={pinDigits.every(d => !d) || isSubmitting}
                            style={{
                                background: 'rgba(255, 255, 255, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)',
                                borderRadius: '12px',
                                padding: '10px 24px',
                                fontSize: '14px',
                                fontWeight: 600,
                                color: '#fff',
                                cursor: (pinDigits.every(d => !d) || isSubmitting) ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s',
                                opacity: (pinDigits.every(d => !d) || isSubmitting) ? 0.4 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!pinDigits.every(d => !d) && !isSubmitting) {
                                    e.currentTarget.style.background = 'rgba(255, 69, 58, 0.15)';
                                    e.currentTarget.style.transform = 'scale(1.05)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
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
                            background: welcomePopup.name === 'Fehler'
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
                            {welcomePopup.name === 'Fehler' && (
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
