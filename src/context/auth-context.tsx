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
    preferred_locale?: 'en' | 'ru' | 'el' | 'de' | 'es';
    streak_days?: number;
    last_activity_date?: string;
    longest_streak?: number;
    acknowledged_manual_version?: string;
    acknowledged_swipe_tutorial_version?: string;
}

interface AuthContextType {
    user: User | null;
    setUser: (user: User | null) => void;
    login: (username: string, pin: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    isAdmin: boolean;
    loading: boolean;
    syncing: boolean; // Neu: Zeigt an ob gerade mit DB abgeglichen wird
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session-Timeout: Role-basiert
const ADMIN_TIMEOUT_MS = 15 * 60 * 1000;      // 15 Minuten
const STUDENT_TIMEOUT_MS = 24 * 60 * 60 * 1000; // 24 Stunden

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [syncing, setSyncing] = useState(false);
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
                    // Sofort setzen für schnellen UI-Load
                    setUser(parsedUser);

                    // ABER: Wir bleiben im "loading" Zustand bis der erste DB-Sync fertig ist!
                    // So verhindern wir, dass Popups basierend auf alten localStorage-Daten aufblitzen.
                    refreshUserFromId(parsedUser.id, parsedUser).then(() => {
                        setLoading(false);
                    });
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
        // 1. Versuch: Supabase verify_user_pin() (bcrypt-validiert + Account Lockout)
        try {
            const { data, error } = await supabase
                .rpc('verify_user_pin', { p_name: username, p_pin: pin });

            if (!error && data && data.length > 0) {
                const dbUser = data[0];

                // Check: Account locked?
                if (dbUser.error === 'Account locked. Try again later.') {
                    console.warn('Account is locked due to failed attempts');
                    return false; // Login fehlgeschlagen (gesperrt)
                }

                // Check: Invalid credentials
                if (dbUser.error) {
                    // Record failed attempt für Account Lockout
                    supabase.rpc('record_admin_failed_login_attempt', { p_name: username })
                        .then(({ data: lockData, error: lockError }) => {
                            if (lockError) console.warn('Failed attempt recording failed:', lockError);
                            if (lockData?.locked) {
                                console.warn('Admin account locked after 5 failed attempts:', lockData);
                            }
                        });
                    return false; // Login fehlgeschlagen
                }

                // Erfolgreicher Login
                const userData: User = {
                    id: dbUser.user_id,
                    email: dbUser.user_email,
                    name: dbUser.user_name,
                    role: dbUser.user_role as 'admin' | 'student',
                    level: dbUser.user_level,
                    difficulty: dbUser.user_difficulty,
                    performance_index: dbUser.user_performance_index,
                    preferred_locale: (dbUser.user_preferred_locale as 'en' | 'ru' | 'el' | 'de' | 'es') || 'en',
                    acknowledged_manual_version: dbUser.user_acknowledged_manual_version,
                    acknowledged_swipe_tutorial_version: dbUser.user_acknowledged_swipe_tutorial_version,
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
                .select('id, email, name, role, level, difficulty, performance_index, preferred_locale, acknowledged_manual_version, acknowledged_swipe_tutorial_version')
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
                    preferred_locale: (data.preferred_locale as 'en' | 'ru' | 'el' | 'de' | 'es') || 'en',
                    acknowledged_manual_version: data.acknowledged_manual_version,
                    acknowledged_swipe_tutorial_version: data.acknowledged_swipe_tutorial_version,
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

        // Login fehlgeschlagen
        console.warn('Login failed: Invalid credentials or database unavailable');
        return false;
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('greeklingua_user');
        localStorage.removeItem('greeklingua_session_ts');
        router.push('/login');
    };

    const refreshUser = async () => {
        if (!user?.id) return;
        await refreshUserFromId(user.id, user);
    };

    const refreshUserFromId = async (userId: string, currentUser?: User | null) => {
        setSyncing(true);
        console.log(`🔄 [AuthContext] Syncing user data for: ${userId}`);

        try {
            // Use RPC to bypass RLS restrictions for anon students
            const { data, error } = await supabase.rpc('get_user_data', {
                p_user_id: userId
            });

            if (error) {
                console.error('❌ [AuthContext] Error fetching user data via RPC:', error);

                // Fallback to direct query if RPC doesn't exist yet (migration not applied)
                if (error.code === 'PGRST202') {
                    console.log('⚠️ [AuthContext] RPC not found, falling back to direct SELECT');
                    const { data: directData, error: directError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', userId)
                        .single();

                    if (directError) {
                        console.error('❌ [AuthContext] Direct SELECT also failed:', directError);
                        return;
                    }

                    if (directData) {
                        updateUserData(directData, currentUser);
                    }
                }
                return;
            }

            if (data && data.length > 0) {
                const fetchedUser = data[0];
                console.log('✅ [AuthContext] User data received:', fetchedUser);
                updateUserData(fetchedUser, currentUser);
            } else {
                console.warn('⚠️ [AuthContext] No user data found for ID:', userId);
            }
        } catch (err) {
            console.warn('❌ [AuthContext] Exception during user refresh:', err);
        } finally {
            setSyncing(false);
        }
    };

    const updateUserData = (data: any, currentUser?: User | null) => {
        const userData: User = {
            ...currentUser,
            ...data,
            id: data.id,
            email: data.email,
            name: data.name,
            role: (data.role as 'admin' | 'student') || 'student',
            level: data.level,
            difficulty: data.difficulty,
            performance_index: data.performance_index,
            preferred_locale: (data.preferred_locale as 'en' | 'ru' | 'el' | 'de' | 'es') || 'en',
            acknowledged_manual_version: data.acknowledged_manual_version || '0.0.0',
            acknowledged_swipe_tutorial_version: data.acknowledged_swipe_tutorial_version || '0.0.0',
            streak_days: data.streak_days || 0,
            longest_streak: data.longest_streak || 0,
            last_activity_date: data.last_activity_date
        };

        console.log('💾 [AuthContext] Updating state with:', userData);
        setUser(userData);
        localStorage.setItem('greeklingua_user', JSON.stringify(userData));
    };

    return (
        <AuthContext.Provider value={{
            user,
            setUser,
            login,
            logout,
            isAuthenticated: !!user,
            isAdmin: user?.role === 'admin',
            loading,
            syncing,
            refreshUser
        }}>
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
