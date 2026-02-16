'use client';

import React from 'react';
import { PracticeModesSection } from './practice-modes-section';

interface PracticeModesTestDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

export function PracticeModesTestDialog({ isOpen, onClose }: PracticeModesTestDialogProps) {
    if (!isOpen) return null;

    return (
        <div
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999,
                padding: '20px',
            }}
            onClick={onClose}
        >
            <div
                style={{
                    backgroundColor: 'white',
                    borderRadius: '12px',
                    maxWidth: '1200px',
                    width: '100%',
                    maxHeight: '90vh',
                    overflow: 'auto',
                    padding: '30px',
                    position: 'relative',
                    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Close Button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '15px',
                        right: '15px',
                        background: 'rgba(0, 0, 0, 0.1)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '40px',
                        height: '40px',
                        fontSize: '24px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'background 0.2s',
                    }}
                    onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.2)';
                    }}
                    onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'rgba(0, 0, 0, 0.1)';
                    }}
                >
                    ×
                </button>

                {/* Header */}
                <h2
                    style={{
                        margin: '0 0 20px 0',
                        fontSize: '28px',
                        fontWeight: 'bold',
                        color: '#333',
                    }}
                >
                    🎮 Practice Modes Test
                </h2>

                {/* Practice Modes Section */}
                <div style={{ marginTop: '20px' }}>
                    <PracticeModesSection />
                </div>
            </div>
        </div>
    );
}
