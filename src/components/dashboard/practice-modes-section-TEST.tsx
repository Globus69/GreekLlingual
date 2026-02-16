/**
 * MINIMAL TEST VERSION - Practice Modes Section
 *
 * Purpose: Verify component rendering and debug blockers
 * - No RPC calls
 * - No dependencies on backend
 * - Just static visible content + debug info
 */

'use client';

import { useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { supabase } from '@/db/supabase';

export function PracticeModesSectionTest() {
    // Test 1: Component Mount
    useEffect(() => {
        console.log('✅ [TEST] PracticeModesSectionTest MOUNTED');
        console.log('✅ [TEST] Timestamp:', new Date().toISOString());
    }, []);

    // Test 2: User Context
    const { user } = useAuth();
    useEffect(() => {
        console.log('👤 [TEST] User from AuthContext:', {
            exists: !!user,
            id: user?.id || 'NOT FOUND',
            name: user?.name || 'NOT FOUND'
        });
    }, [user]);

    // Test 3: Supabase Client
    useEffect(() => {
        console.log('🗄️ [TEST] Supabase Client:', {
            exists: !!supabase,
            initialized: typeof supabase !== 'undefined'
        });
    }, []);

    return (
        <div style={{
            background: 'linear-gradient(135deg, #ff0000 0%, #cc0000 100%)',
            border: '5px solid yellow',
            borderRadius: '16px',
            padding: '40px',
            margin: '20px 0',
            color: 'white',
            fontFamily: 'monospace',
            fontSize: '18px',
            fontWeight: 'bold',
            boxShadow: '0 0 40px rgba(255, 0, 0, 0.8)',
            textAlign: 'center',
            minHeight: '200px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            justifyContent: 'center',
            alignItems: 'center'
        }}>
            {/* Header */}
            <div style={{
                fontSize: '32px',
                textShadow: '0 0 10px rgba(255, 255, 0, 1)',
                animation: 'pulse 2s infinite'
            }}>
                🎮 PRACTICE TEST – WENN DU DAS SIEHST, RENDERT ES 🎮
            </div>

            {/* Debug Info Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                width: '100%',
                maxWidth: '600px',
                background: 'rgba(0, 0, 0, 0.3)',
                padding: '20px',
                borderRadius: '12px',
                fontSize: '14px',
                textAlign: 'left'
            }}>
                <div>
                    <div style={{ color: '#ffff00', marginBottom: '8px' }}>👤 User Status:</div>
                    <div style={{ color: user ? '#00ff00' : '#ff0000' }}>
                        {user ? `✅ Logged in as: ${user.name}` : '❌ NOT LOGGED IN'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#cccccc', marginTop: '4px' }}>
                        User ID: {user?.id || 'null'}
                    </div>
                </div>

                <div>
                    <div style={{ color: '#ffff00', marginBottom: '8px' }}>🗄️ Supabase:</div>
                    <div style={{ color: supabase ? '#00ff00' : '#ff0000' }}>
                        {supabase ? '✅ Client initialized' : '❌ NOT INITIALIZED'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#cccccc', marginTop: '4px' }}>
                        Type: {typeof supabase}
                    </div>
                </div>

                <div>
                    <div style={{ color: '#ffff00', marginBottom: '8px' }}>⏰ Render Time:</div>
                    <div style={{ color: '#00ff00' }}>
                        {new Date().toLocaleTimeString('de-DE')}
                    </div>
                </div>

                <div>
                    <div style={{ color: '#ffff00', marginBottom: '8px' }}>🌐 Environment:</div>
                    <div style={{ color: '#00ff00' }}>
                        {process.env.NODE_ENV || 'unknown'}
                    </div>
                </div>
            </div>

            {/* Action Info */}
            <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                padding: '16px',
                borderRadius: '8px',
                fontSize: '14px',
                maxWidth: '700px'
            }}>
                <div style={{ color: '#ffff00', marginBottom: '8px' }}>📋 Next Steps:</div>
                <ol style={{ textAlign: 'left', lineHeight: '1.8', color: '#ffffff' }}>
                    <li>✅ Check Console for logs: "PracticeModesSectionTest MOUNTED"</li>
                    <li>✅ Verify User is logged in (see above)</li>
                    <li>✅ Verify Supabase client initialized</li>
                    <li>⏭️ If all green → Replace with real PracticeModesSection</li>
                </ol>
            </div>

            {/* Inline animation */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
            `}</style>
        </div>
    );
}
