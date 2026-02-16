/**
 * ULTRA-MINIMAL TEST VERSION
 * No hooks, no imports, just pure React
 */

'use client';

export function PracticeModesSectionMinimal() {
    return (
        <div style={{
            background: 'red',
            border: '5px solid yellow',
            padding: '40px',
            color: 'white',
            fontSize: '24px',
            fontWeight: 'bold',
            textAlign: 'center',
            borderRadius: '12px',
            margin: '20px 0'
        }}>
            <div style={{ fontSize: '32px', marginBottom: '20px' }}>
                ✅ PRACTICE MODES TEST - ICH BIN SICHTBAR!
            </div>
            <div style={{ fontSize: '16px', background: 'rgba(0,0,0,0.5)', padding: '20px', borderRadius: '8px' }}>
                Wenn du das siehst, rendert die Komponente korrekt.
                <br /><br />
                Check Console für JavaScript-Errors.
            </div>
        </div>
    );
}
