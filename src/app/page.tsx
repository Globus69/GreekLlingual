"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (user) {
      router.push("/dashboard");
    } else {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Kurzer Ladebildschirm waehrend Redirect
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#0A0A0C',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        fontSize: '48px',
        animation: 'spin 1.5s ease-in-out infinite',
      }}>
        🏛️
      </div>
      <style jsx global>{`
        @keyframes spin {
          0%, 100% { transform: scale(1); opacity: 0.7; }
          50% { transform: scale(1.1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
