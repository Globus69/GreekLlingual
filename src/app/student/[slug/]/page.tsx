"use client";

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/db/supabase';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import StatsCard from '@/components/dashboard/StatsCard';
import ActionGrid from '@/components/dashboard/ActionGrid';
import ModuleGrid from '@/components/dashboard/ModuleGrid';
import '@/styles/liquid-glass.css';

interface StudentData {
    id: string;
    name: string;
    page_slug: string;
}

export default function StudentDashboardPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = use(params);
    const { user, loading: authLoading } = useAuth();
    const router = useRouter();
    const [student, setStudent] = useState<StudentData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
            return;
        }

        if (user) {
            fetchStudentData();
        }
    }, [user, authLoading, slug]);

    const fetchStudentData = async () => {
        try {
            const { data, error } = await supabase
                .from('students')
                .select('*')
                .eq('page_slug', slug)
                .single();

            if (error || !data) {
                console.error("Student not found:", error);
                // Fallback for demo
                setStudent({ id: 'demo-std', name: slug.charAt(0).toUpperCase() + slug.slice(1), page_slug: slug });
            } else {
                setStudent(data);
            }
        } catch (err) {
            console.error("fetchStudentData error:", err);
            setStudent({ id: 'demo-std', name: slug.charAt(0).toUpperCase() + slug.slice(1), page_slug: slug });
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="login-overlay">
                <h1 style={{ color: 'white', fontSize: '24px' }}>🏛️ Loading {slug}'s Workspace...</h1>
            </div>
        );
    }

    return (
        <div id="app" className="dashboard-layout">
            <DashboardHeader studentName={student?.name} />
            <main className="dashboard-content">
                <div className="hero-section">
                    <StatsCard />
                    <ActionGrid />
                </div>
                <ModuleGrid />
            </main>
        </div>
    );
}
