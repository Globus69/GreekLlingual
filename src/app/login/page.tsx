"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import '@/styles/liquid-glass.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [pin, setPin] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const { login, user } = useAuth();
    const router = useRouter();

    // Auto-redirect to dashboard after 1 second (for development before app completion)
    useEffect(() => {
        // Only redirect if user is already logged in or if we have a stored user
        const storedUser = localStorage.getItem('greeklingua_user');
        const hasUser = user || storedUser;
        
        if (!hasUser) {
            // No user found - don't redirect to avoid infinite loop
            return;
        }

        const timer = setTimeout(() => {
            router.push('/dashboard');
        }, 1000); // 1 second delay

        return () => clearTimeout(timer);
    }, [user, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        const success = await login(email, pin);
        if (!success) {
            setError('Invalid email or PIN. Please try again.');
            setIsSubmitting(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <div className="login-logo">🏛️</div>
                <h2 className="login-title">GreekLingua</h2>
                <p className="login-subtitle">Enter your details to continue learning</p>

                <form onSubmit={handleSubmit} style={{ width: '100%' }}>
                    <div className="input-group">
                        <input
                            type="email"
                            placeholder="Email"
                            className="login-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div className="input-group">
                        <input
                            type="password"
                            placeholder="6-Digit PIN"
                            className="login-input"
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            maxLength={6}
                            required
                        />
                    </div>

                    {error && <p style={{ color: '#FF453A', fontSize: '13px', marginBottom: '20px', textAlign: 'center' }}>{error}</p>}

                    <button
                        type="submit"
                        className="login-btn"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Signing in...' : 'Sign In'}
                    </button>
                </form>

                <button className="biometric-btn">
                    <span>👤</span> Use FaceID / TouchID
                </button>
            </div>
        </div>
    );
}
