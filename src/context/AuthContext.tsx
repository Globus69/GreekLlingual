"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/db/supabase';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    email: string;
    name?: string;
}

interface AuthContextType {
    user: User | null;
    login: (email: string, pin: string) => Promise<boolean>;
    logout: () => void;
    isAuthenticated: boolean;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check for session in local storage or cookies if needed
        const storedUser = localStorage.getItem('greeklingua_user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        } else {
            // Auto-login for now as requested
            const demoUser = { id: 'demo-user-id', email: 'admin@greeklingua.com' };
            setUser(demoUser);
            localStorage.setItem('greeklingua_user', JSON.stringify(demoUser));
        }
        setLoading(false);
    }, []);

    const login = async (email: string, pin: string) => {
        // Demo Fallback
        if (email === 'admin@greeklingua.com' && pin === '123456') {
            const userData = { id: 'demo-user-id', email: 'admin@greeklingua.com' };
            setUser(userData);
            localStorage.setItem('greeklingua_user', JSON.stringify(userData));
            router.push('/dashboard');
            return true;
        }

        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('pin', pin)
                .single();

            if (error || !data) {
                console.error("Login failed:", error);
                return false;
            }

            const userData = { id: data.id, email: data.email };
            setUser(userData);
            localStorage.setItem('greeklingua_user', JSON.stringify(userData));
            router.push('/dashboard');
            return true;
        } catch (err) {
            console.error("Auth error:", err);
            return false;
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('greeklingua_user');
        router.push('/login');
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user, loading }}>
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
