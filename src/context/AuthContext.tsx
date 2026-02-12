"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name?: string;
    role?: 'admin' | 'student';
    level?: string;
    difficulty?: string;
    performance_index?: string;
    preferred_locale?: 'en' | 'ru' | 'el' | 'de';
}

interface AuthContextType {
    user: User | null;
    login: (username: string, pin: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session-Timeout: Role-basiert
const ADMIN_TIMEOUT_MS = 15 * 60 * 1000;      // 15 Minuten
const STUDENT_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 Stunden

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Session aus localStorage laden + Timeout pruefen
        const storedUser = localStorage.getItem('greeklingua_user');
        const sessionTimestamp = localStorage.getItem('greeklingua_session_ts');

        if (storedUser && sessionTimestamp) {
            try {
                const parsedUser = JSON.parse(storedUser);
                const elapsed = Date.now() - parseInt(sessionTimestamp, 10);

                // Role-basierter Timeout
                const timeoutMs = parsedUser?.role === 'admin'
                    ? ADMIN_TIMEOUT_MS
                    : STUDENT_TIMEOUT_MS;

                if (elapsed > timeoutMs) {
                    // Session abgelaufen
                    const timeoutLabel = parsedUser?.role === 'admin' ? '15 minutes' : '24 hours';
                    console.warn(`Session expired after ${timeoutLabel}, logging out.`);
                    localStorage.removeItem('greeklingua_user');
                    localStorage.removeItem('greeklingua_session_ts');
                    setUser(null);
                    setLoading(false);
                    return;
                }

                if (parsedUser && parsedUser.id) {
                    setUser(parsedUser);
                    setLoading(false);
                    return;
                }
            } catch (err) {
                console.error("Error parsing stored user:", err);
                localStorage.removeItem('greeklingua_user');
                localStorage.removeItem('greeklingua_session_ts');
            }
        }
        
        // Kein gespeicherter User – Login erforderlich
        setUser(null);
        setLoading(false);
    }, []);

    // Periodischer Check: Admin-Session-Ablauf prüfen (alle 60 Sekunden)
    useEffect(() => {
        if (!user || user.role !== 'admin') return;

        const interval = setInterval(() => {
            const timestamp = localStorage.getItem('greeklingua_session_ts');
            if (!timestamp) return;

            const elapsed = Date.now() - parseInt(timestamp, 10);

            if (elapsed > ADMIN_TIMEOUT_MS) {
                console.warn('Admin session expired (periodic check), logging out.');
                localStorage.removeItem('greeklingua_user');
                localStorage.removeItem('greeklingua_session_ts');
                setUser(null);
                router.push('/login');
            }
        }, 60000); // Check every minute

        return () => clearInterval(interval);
    }, [user, router]);

    const login = async (username: string, pin: string) => {
        // 1. Versuch: Supabase verify_user_pin() (bcrypt-validiert)
        try {
            const { data, error } = await supabase
                .rpc('verify_user_pin', { p_name: username, p_pin: pin });

            if (!error && data && data.length > 0) {
                const dbUser = data[0];
                const userData: User = {
                    id: dbUser.user_id,
                    email: dbUser.user_email,
                    name: dbUser.user_name,
                    role: dbUser.user_role as 'admin' | 'student',
                    level: dbUser.user_level,
                    difficulty: dbUser.user_difficulty,
                    performance_index: dbUser.user_performance_index,
                    preferred_locale: (dbUser.user_preferred_locale as 'en' | 'ru' | 'el' | 'de') || 'en',
                };
                setUser(userData);
                localStorage.setItem('greeklingua_user', JSON.stringify(userData));
                localStorage.setItem('greeklingua_session_ts', String(Date.now()));
                router.push('/dashboard');
                return true;
            }
        } catch (err) {
            console.warn('Supabase verify_user_pin not available, trying fallback:', err);
        }

        // 2. Versuch: Supabase direkte Abfrage (name + pin Klartext, Legacy)
        try {
            const { data, error } = await supabase
                .from('users')
                .select('id, email, name, role, level, difficulty, performance_index, preferred_locale')
                .ilike('name', username)
                .eq('pin', pin)
                .single();

            if (!error && data) {
                const userData: User = {
                    id: data.id,
                    email: data.email,
                    name: data.name,
                    role: (data.role as 'admin' | 'student') || 'student',
                    level: data.level,
                    difficulty: data.difficulty,
                    performance_index: data.performance_index,
                    preferred_locale: (data.preferred_locale as 'en' | 'ru' | 'el' | 'de') || 'en',
                };
                setUser(userData);
                localStorage.setItem('greeklingua_user', JSON.stringify(userData));
                localStorage.setItem('greeklingua_session_ts', String(Date.now()));
                router.push('/dashboard');
                return true;
            }
        } catch (err) {
            console.warn('Supabase direct query failed, trying local fallback:', err);
        }

        // 3. Fallback: Lokaler Admin-Account (funktioniert ohne Supabase)
        if (username.toLowerCase() === 'admin' && pin === '123456') {
            const adminUser: User = {
                id: 'admin-local',
                email: 'admin@greeklingua.local',
                name: 'Admin',
                role: 'admin',
                level: 'A1',
                difficulty: 'easy',
                performance_index: 'A1-easy',
            };
            setUser(adminUser);
            localStorage.setItem('greeklingua_user', JSON.stringify(adminUser));
            localStorage.setItem('greeklingua_session_ts', String(Date.now()));
            router.push('/dashboard');
            return true;
        }

        // Login fehlgeschlagen
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('greeklingua_user');
        localStorage.removeItem('greeklingua_session_ts');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isAdmin: user?.role === 'admin', loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
