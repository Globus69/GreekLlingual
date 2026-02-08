"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useLanguage, Locale } from '@/context/LanguageContext';
import { useTranslation } from '@/lib/useTranslation';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [pinDigits, setPinDigits] = useState<string[]>(['', '', '', '', '', '']);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [shake, setShake] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const { login, user } = useAuth();
    const router = useRouter();
    const { locale, setLocale, syncLocaleFromUser } = useLanguage();
    const { t } = useTranslation();
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const pinRefs = useRef<(HTMLInputElement | null)[]>([]);

    // If already logged in, redirect to dashboard
    useEffect(() => {
        if (user) {
            router.push('/dashboard');
        }
    }, [user, router]);

    // Animated background particles – Farbe wechselt mit Sprache
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let animationId: number;
        const isRu = locale === 'ru';
        const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number; hue: number }[] = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        // Create particles – Hue: EN=blau (200-240), RU=rot (340-20)
        for (let i = 0; i < 60; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                vx: (Math.random() - 0.5) * 0.4,
                vy: (Math.random() - 0.5) * 0.4,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.4 + 0.1,
                hue: isRu
                    ? Math.random() * 30 + 345 // rot-ish range (345-375 → wraps to 345-15)
                    : Math.random() * 40 + 200, // blau-ish range (200-240)
            });
        }

        // Verbindungslinien-Farbe
        const lineColor = isRu ? '180, 60, 60' : '0, 122, 255';

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw connections
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

            // Draw & move particles
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

    const handlePinChange = (index: number, value: string) => {
        // Nur Ziffern erlauben
        if (value && !/^\d$/.test(value)) return;

        const newDigits = [...pinDigits];
        newDigits[index] = value;
        setPinDigits(newDigits);

        // Auto-Focus auf naechstes Feld
        if (value && index < 5) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    const handlePinKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !pinDigits[index] && index > 0) {
            // Bei Backspace auf leerem Feld: zurueck zum vorherigen
            pinRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowLeft' && index > 0) {
            pinRefs.current[index - 1]?.focus();
        }
        if (e.key === 'ArrowRight' && index < 5) {
            pinRefs.current[index + 1]?.focus();
        }
    };

    const handlePinPaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
        if (pasted.length > 0) {
            const newDigits = [...pinDigits];
            for (let i = 0; i < pasted.length && i < 6; i++) {
                newDigits[i] = pasted[i];
            }
            setPinDigits(newDigits);
            // Focus auf das naechste leere oder letzte Feld
            const nextEmpty = newDigits.findIndex(d => !d);
            pinRefs.current[nextEmpty >= 0 ? nextEmpty : 5]?.focus();
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        const pin = pinDigits.join('');
        if (pin.length !== 6) {
            setError(t('login.error'));
            setShake(true);
            setTimeout(() => setShake(false), 600);
            return;
        }

        setIsSubmitting(true);

        const success = await login(username, pin);
        if (success) {
            // Nach Login: Sprache aus User-Profil laden (falls in DB gespeichert)
            try {
                const storedUser = localStorage.getItem('greeklingua_user');
                if (storedUser) {
                    const userData = JSON.parse(storedUser);
                    if (userData.preferred_locale) {
                        syncLocaleFromUser(userData.preferred_locale);
                    }
                }
            } catch {
                // Ignore – Sprache bleibt wie sie ist
            }
            return;
        }
        if (!success) {
            setError(t('login.error'));
            setShake(true);
            setPinDigits(['', '', '', '', '', '']);
            pinRefs.current[0]?.focus();
            setTimeout(() => setShake(false), 600);
            setIsSubmitting(false);
        }
    };

    const handleLanguageChange = (lang: Locale) => {
        setLocale(lang);
    };

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
                @keyframes pulseGlow {
                    0%, 100% { box-shadow: 0 8px 32px rgba(0, 122, 255, 0.35); }
                    50% { box-shadow: 0 8px 48px rgba(0, 122, 255, 0.55); }
                }
                @keyframes spinIn {
                    from { transform: rotate(-10deg) scale(0.8); opacity: 0; }
                    to { transform: rotate(0) scale(1); opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(12px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>

            <div style={{
                position: 'fixed',
                inset: 0,
                background: locale === 'ru'
                    ? 'radial-gradient(ellipse at 50% 50%, #3d1535 0%, #1a0818 50%, #0A0A0C 100%)'
                    : 'radial-gradient(ellipse at 50% 50%, #0f2555 0%, #0a1230 50%, #0A0A0C 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
                transition: 'background 0.6s ease',
            }}>
                {/* Animated Canvas Background */}
                <canvas
                    ref={canvasRef}
                    style={{ position: 'absolute', inset: 0, zIndex: 0 }}
                />

                {/* Gradient Orbs – Farbe wechselt mit Sprache */}
                <div style={{
                    position: 'absolute',
                    width: '500px',
                    height: '500px',
                    borderRadius: '50%',
                    background: locale === 'ru'
                        ? 'radial-gradient(circle, rgba(224, 85, 85, 0.18) 0%, transparent 70%)'
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
                        : 'radial-gradient(circle, rgba(88, 86, 214, 0.15) 0%, transparent 70%)',
                    bottom: '-80px',
                    left: '-80px',
                    animation: 'orbFloat2 15s ease-in-out infinite',
                    pointerEvents: 'none',
                    transition: 'background 0.6s ease',
                }} />

                {/* Language Selector – Top Right */}
                <div style={{
                    position: 'absolute',
                    top: '24px',
                    right: '24px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    background: 'rgba(28, 28, 30, 0.7)',
                    backdropFilter: 'blur(30px)',
                    WebkitBackdropFilter: 'blur(30px)',
                    borderRadius: '14px',
                    padding: '6px 8px 6px 14px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    zIndex: 10,
                    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
                }}>
                    <span style={{ fontSize: '14px' }}>🌐</span>
                    <div style={{
                        display: 'flex',
                        gap: '4px',
                        background: 'rgba(0, 0, 0, 0.3)',
                        borderRadius: '10px',
                        padding: '3px',
                    }}>
                        {(['en', 'ru'] as Locale[]).map((lang) => (
                            <button
                                key={lang}
                                type="button"
                                onClick={() => handleLanguageChange(lang)}
                                style={{
                                    padding: '8px 16px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    background: locale === lang
                                        ? lang === 'ru'
                                            ? 'linear-gradient(135deg, #E05555, #C0392B)'
                                            : 'linear-gradient(135deg, #007AFF, #5856D6)'
                                        : 'transparent',
                                    color: locale === lang ? '#fff' : '#8E8E93',
                                    fontSize: '13px',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                    letterSpacing: '1px',
                                    textTransform: 'uppercase',
                                    boxShadow: locale === lang
                                        ? lang === 'ru'
                                            ? '0 2px 8px rgba(224, 85, 85, 0.3)'
                                            : '0 2px 8px rgba(0, 122, 255, 0.3)'
                                        : 'none',
                                }}
                            >
                                {lang === 'en' ? 'EN' : 'RU'}
                            </button>
                        ))}
                    </div>
                </div>

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
                        animation: 'spinIn 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
                        filter: 'drop-shadow(0 0 24px rgba(0, 122, 255, 0.3))',
                    }}>
                        🏛️
                    </div>

                    {/* Title */}
                    <h1 style={{
                        fontSize: '26px',
                        fontWeight: 800,
                        color: '#fff',
                        margin: '0 0 4px 0',
                        letterSpacing: '-0.5px',
                        animation: 'slideUp 0.6s ease-out 0.2s both',
                    }}>
                        {t('login.title')}
                    </h1>

                    {/* Subtitle */}
                    <p style={{
                        fontSize: '14px',
                        color: '#6E6E73',
                        margin: '0 0 36px 0',
                        textAlign: 'center',
                        lineHeight: '1.5',
                        animation: 'slideUp 0.6s ease-out 0.3s both',
                    }}>
                        {t('login.subtitle')}
                    </p>

                    {/* Form */}
                    <form onSubmit={handleSubmit} autoComplete="off" data-lpignore="true" style={{
                        width: '100%',
                        animation: 'slideUp 0.6s ease-out 0.4s both',
                    }}>
                        {/* Username Field */}
                        <div style={{ position: 'relative', marginBottom: '16px' }}>
                            <div style={{
                                position: 'absolute',
                                left: '16px',
                                top: '50%',
                                transform: 'translateY(-50%)',
                                fontSize: '16px',
                                opacity: 0.4,
                                transition: 'opacity 0.2s',
                                ...(focusedField === 'username' ? { opacity: 0.8 } : {}),
                            }}>
                                👤
                            </div>
                            <input
                                type="text"
                                placeholder={t('login.email_placeholder')}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={() => setFocusedField('username')}
                                onBlur={() => setFocusedField(null)}
                                required
                                autoComplete="off"
                                data-lpignore="true"
                                data-1p-ignore
                                data-form-type="other"
                                style={{
                                    width: '100%',
                                    background: focusedField === 'username'
                                        ? 'rgba(0, 0, 0, 0.5)'
                                        : 'rgba(0, 0, 0, 0.25)',
                                    border: `1.5px solid ${focusedField === 'username'
                                        ? 'rgba(0, 122, 255, 0.5)'
                                        : 'rgba(255, 255, 255, 0.06)'}`,
                                    borderRadius: '16px',
                                    padding: '16px 20px 16px 44px',
                                    fontSize: '15px',
                                    color: '#fff',
                                    outline: 'none',
                                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                    boxSizing: 'border-box',
                                    fontFamily: 'inherit',
                                    boxShadow: focusedField === 'username'
                                        ? '0 0 0 4px rgba(0, 122, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.2)'
                                        : 'none',
                                }}
                            />
                        </div>

                        {/* PIN Field – 6 einzelne Ziffernfelder */}
                        <div style={{ marginBottom: '20px' }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                marginBottom: '8px',
                            }}>
                                <span style={{ fontSize: '16px', opacity: 0.4 }}>🔒</span>
                                <span style={{ fontSize: '13px', color: '#6E6E73', fontWeight: 500 }}>
                                    {t('login.pin_placeholder')}
                                </span>
                            </div>
                            <div style={{
                                display: 'flex',
                                gap: '8px',
                                justifyContent: 'center',
                            }}>
                                {pinDigits.map((digit, index) => (
                                    <input
                                        key={index}
                                        ref={(el) => { pinRefs.current[index] = el; }}
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={1}
                                        value={digit}
                                        onChange={(e) => handlePinChange(index, e.target.value)}
                                        onKeyDown={(e) => handlePinKeyDown(index, e)}
                                        onPaste={index === 0 ? handlePinPaste : undefined}
                                        onFocus={() => setFocusedField(`pin-${index}`)}
                                        onBlur={() => setFocusedField(null)}
                                        autoComplete="off"
                                        data-lpignore="true"
                                        data-1p-ignore
                                        data-form-type="other"
                                        style={{
                                            width: '48px',
                                            height: '56px',
                                            background: focusedField === `pin-${index}`
                                                ? 'rgba(0, 0, 0, 0.5)'
                                                : digit
                                                    ? 'rgba(0, 122, 255, 0.08)'
                                                    : 'rgba(0, 0, 0, 0.25)',
                                            border: `1.5px solid ${focusedField === `pin-${index}`
                                                ? 'rgba(0, 122, 255, 0.5)'
                                                : digit
                                                    ? 'rgba(0, 122, 255, 0.2)'
                                                    : 'rgba(255, 255, 255, 0.06)'}`,
                                            borderRadius: '14px',
                                            fontSize: '22px',
                                            fontWeight: 700,
                                            color: '#fff',
                                            textAlign: 'center',
                                            outline: 'none',
                                            transition: 'all 0.2s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                            boxSizing: 'border-box',
                                            fontFamily: 'inherit',
                                            caretColor: '#007AFF',
                                            boxShadow: focusedField === `pin-${index}`
                                                ? '0 0 0 4px rgba(0, 122, 255, 0.1), 0 4px 16px rgba(0, 0, 0, 0.2)'
                                                : 'none',
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <p style={{
                                color: '#FF453A',
                                fontSize: '13px',
                                marginBottom: '16px',
                                textAlign: 'center',
                                background: 'rgba(255, 69, 58, 0.08)',
                                padding: '10px 16px',
                                borderRadius: '12px',
                                border: '1px solid rgba(255, 69, 58, 0.15)',
                            }}>
                                {error}
                            </p>
                        )}

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            style={{
                                width: '100%',
                                background: isSubmitting
                                    ? 'rgba(0, 122, 255, 0.5)'
                                    : 'linear-gradient(135deg, #007AFF 0%, #5856D6 100%)',
                                color: 'white',
                                border: 'none',
                                padding: '17px',
                                borderRadius: '16px',
                                fontSize: '16px',
                                fontWeight: 700,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                                boxShadow: '0 8px 32px rgba(0, 122, 255, 0.35)',
                                letterSpacing: '0.3px',
                                position: 'relative',
                                overflow: 'hidden',
                            }}
                            onMouseEnter={(e) => {
                                if (!isSubmitting) {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 12px 44px rgba(0, 122, 255, 0.5)';
                                }
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 122, 255, 0.35)';
                            }}
                        >
                            {isSubmitting ? (
                                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                    <span style={{
                                        display: 'inline-block',
                                        width: '16px',
                                        height: '16px',
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        animation: 'spin 0.8s linear infinite',
                                    }} />
                                    {t('login.submitting')}
                                </span>
                            ) : t('login.submit')}
                        </button>
                    </form>

                    {/* Divider */}
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        width: '100%',
                        margin: '24px 0 20px',
                        animation: 'slideUp 0.6s ease-out 0.5s both',
                    }}>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                        <span style={{ fontSize: '11px', color: '#4A4A4E', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '1px' }}>
                            {locale === 'ru' ? 'или' : 'or'}
                        </span>
                        <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.06)' }} />
                    </div>

                    {/* Biometric Button */}
                    <button
                        type="button"
                        style={{
                            width: '100%',
                            background: 'rgba(255, 255, 255, 0.04)',
                            border: '1px solid rgba(255, 255, 255, 0.06)',
                            borderRadius: '14px',
                            padding: '14px',
                            color: '#007AFF',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.3s',
                            animation: 'slideUp 0.6s ease-out 0.55s both',
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'rgba(0, 122, 255, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(0, 122, 255, 0.2)';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.04)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)';
                        }}
                    >
                        <span style={{ fontSize: '18px' }}>🔐</span>
                        {t('login.biometric')}
                    </button>
                </div>

                {/* Footer branding */}
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
                    HellenicHorizons &copy; {new Date().getFullYear()}
                </div>
            </div>

            {/* Spinner keyframe */}
            <style jsx global>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                input::placeholder {
                    color: #4A4A4E !important;
                }
            `}</style>
        </>
    );
}
