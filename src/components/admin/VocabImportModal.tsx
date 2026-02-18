'use client';

import React, { useState, CSSProperties } from 'react';
import type { ImportMode, ImportResult, VocabCSVRow } from '@/types/vocabulary';
import { importCSV, downloadTemplate } from '@/lib/api/vocab';
import { validateVocabEntry } from '@/types/vocabulary';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface VocabImportModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function VocabImportModal({ onClose, onSuccess }: VocabImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<ImportMode>('append');
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState<VocabCSVRow[]>([]);
    const [validationErrors, setValidationErrors] = useState<Map<number, string[]>>(new Map());
    const [importResult, setImportResult] = useState<ImportResult | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            previewFile(selectedFile);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile && droppedFile.type === 'text/csv') {
            setFile(droppedFile);
            previewFile(droppedFile);
        } else {
            toast.error('Please drop a CSV file');
        }
    };

    const previewFile = (file: File) => {
        Papa.parse<VocabCSVRow>(file, {
            header: true,
            skipEmptyLines: true,
            preview: 10,
            complete: (results) => {
                setPreviewData(results.data);
                validatePreview(results.data);
            },
            error: (error) => {
                console.error('Parse error:', error);
                toast.error('Failed to parse CSV file');
            },
        });
    };

    const validatePreview = (data: VocabCSVRow[]) => {
        const errors = new Map<number, string[]>();

        data.forEach((row, index) => {
            const validation = validateVocabEntry({
                greek_transcription: row.greek_transcription,
                level: row.level as any,
                difficulty: row.difficulty as any,
                frequency: parseInt(row.frequency) as any,
            });

            if (!validation.valid) {
                errors.set(index, validation.errors);
            }
        });

        setValidationErrors(errors);
    };

    const handleImport = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        if (mode === 'overwrite') {
            const confirmed = confirm(
                '⚠️ WARNING: This will DELETE ALL existing vocabulary entries and replace them with the imported data.\n\nThis action cannot be undone. Continue?'
            );
            if (!confirmed) return;
        }

        try {
            setImporting(true);
            const result = await importCSV(file, mode);
            setImportResult(result);

            if (result.success) {
                toast.success(`Import complete: ${result.imported} entries imported`);
                setTimeout(() => {
                    onSuccess();
                }, 2000);
            } else {
                toast.warning(`Import completed with errors: ${result.imported} imported, ${result.skipped} skipped`);
            }
        } catch (error: any) {
            console.error('Import error:', error);
            toast.error(error?.message || 'Import failed');
        } finally {
            setImporting(false);
        }
    };

    const hasErrors = validationErrors.size > 0;

    return (
        <div style={overlayStyle} onClick={onClose}>
            <div style={modalStyle} onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div style={headerStyle}>
                    <h2 style={titleStyle}>Import Vocabulary CSV</h2>
                    <button onClick={onClose} style={closeButtonStyle}>
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={contentStyle}>
                    {/* Download Template */}
                    <div style={templateSectionStyle}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <button onClick={downloadTemplate} style={downloadButtonStyle}>
                                📥 Vorlage Vollständig
                            </button>
                            <a
                                href="/templates/Vorlage-Vokabeln-Schnell.csv"
                                download="Vorlage-Vokabeln-Schnell.csv"
                                style={{ ...downloadButtonStyle, textDecoration: 'none' }}
                            >
                                ⚡ Vorlage Schnell
                            </a>
                            <a
                                href="/templates/Import-Vokabeln-A1-Beispiel.csv"
                                download="Import-Vokabeln-A1-Beispiel.csv"
                                style={{ ...downloadButtonStyle, textDecoration: 'none', background: 'rgba(90, 200, 250, 0.15)', border: '1px solid rgba(90, 200, 250, 0.3)', color: '#5AC8FA' }}
                            >
                                📚 A1 Beispiel
                            </a>
                        </div>
                        <p style={hintTextStyle}>
                            Wähle eine Vorlage: Vollständig (alle Felder), Schnell (nur Pflichtfelder), oder Beispiel (10 A1 Vokabeln)
                        </p>
                    </div>

                    {/* File Upload */}
                    <div
                        style={dropZoneStyle}
                        onDrop={handleDrop}
                        onDragOver={(e) => e.preventDefault()}
                    >
                        <input
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            style={fileInputStyle}
                            id="csv-upload"
                        />
                        <label htmlFor="csv-upload" style={dropZoneLabelStyle}>
                            {file ? (
                                <>
                                    <div style={fileIconStyle}>📄</div>
                                    <div style={fileNameStyle}>{file.name}</div>
                                    <div style={fileSizeStyle}>
                                        {(file.size / 1024).toFixed(1)} KB
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div style={uploadIconStyle}>📂</div>
                                    <div style={uploadTextStyle}>
                                        Drop CSV file here or click to browse
                                    </div>
                                </>
                            )}
                        </label>
                    </div>

                    {/* Mode Selector */}
                    <div style={modeSectionStyle}>
                        <div style={modeHeaderStyle}>Import Mode:</div>
                        <div style={modeOptionsStyle}>
                            <label style={modeOptionStyle}>
                                <input
                                    type="radio"
                                    name="mode"
                                    value="append"
                                    checked={mode === 'append'}
                                    onChange={(e) => setMode(e.target.value as ImportMode)}
                                    style={radioStyle}
                                />
                                <div>
                                    <div style={modeTitleStyle}>Append</div>
                                    <div style={modeDescStyle}>Add new entries (keep existing)</div>
                                </div>
                            </label>
                            <label style={modeOptionStyle}>
                                <input
                                    type="radio"
                                    name="mode"
                                    value="overwrite"
                                    checked={mode === 'overwrite'}
                                    onChange={(e) => setMode(e.target.value as ImportMode)}
                                    style={radioStyle}
                                />
                                <div>
                                    <div style={modeTitleStyle}>Overwrite</div>
                                    <div style={modeDescStyle}>⚠️ Delete all, then import</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Preview */}
                    {previewData.length > 0 && (
                        <div style={previewSectionStyle}>
                            <h3 style={previewTitleStyle}>
                                Preview (first 10 rows)
                                {hasErrors && (
                                    <span style={errorBadgeStyle}>{validationErrors.size} errors</span>
                                )}
                            </h3>
                            <div style={previewTableContainerStyle}>
                                <table style={previewTableStyle}>
                                    <thead>
                                        <tr>
                                            <th style={previewThStyle}>#</th>
                                            <th style={previewThStyle}>Greek</th>
                                            <th style={previewThStyle}>EN</th>
                                            <th style={previewThStyle}>Level</th>
                                            <th style={previewThStyle}>Difficulty</th>
                                            <th style={previewThStyle}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map((row, index) => {
                                            const rowErrors = validationErrors.get(index);
                                            const isValid = !rowErrors;

                                            return (
                                                <tr key={index} style={previewTrStyle(isValid)}>
                                                    <td style={previewTdStyle}>{index + 1}</td>
                                                    <td style={previewTdStyle}>{row.greek_transcription}</td>
                                                    <td style={previewTdStyle}>{row.en_translation}</td>
                                                    <td style={previewTdStyle}>{row.level}</td>
                                                    <td style={previewTdStyle}>{row.difficulty}</td>
                                                    <td style={previewTdStyle}>
                                                        {isValid ? (
                                                            <span style={validBadgeStyle}>✓ Valid</span>
                                                        ) : (
                                                            <span style={invalidBadgeStyle} title={rowErrors?.join(', ')}>
                                                                ✗ Invalid
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Import Result */}
                    {importResult && (
                        <div style={resultSectionStyle}>
                            <h3 style={resultTitleStyle}>Import Results</h3>
                            <div style={resultStatsStyle}>
                                <div style={resultStatStyle}>
                                    <span style={resultStatLabelStyle}>Imported:</span>
                                    <span style={resultStatValueStyle(true)}>{importResult.imported}</span>
                                </div>
                                <div style={resultStatStyle}>
                                    <span style={resultStatLabelStyle}>Skipped:</span>
                                    <span style={resultStatValueStyle(false)}>{importResult.skipped}</span>
                                </div>
                            </div>
                            {importResult.errors.length > 0 && (
                                <div style={errorListContainerStyle}>
                                    <div style={errorListTitleStyle}>Errors:</div>
                                    <div style={errorListStyle}>
                                        {importResult.errors.slice(0, 5).map((error, index) => (
                                            <div key={index} style={errorItemStyle}>
                                                {typeof error === 'string' ? error : `Row ${error.row}: ${error.message}`}
                                            </div>
                                        ))}
                                        {importResult.errors.length > 5 && (
                                            <div style={errorMoreStyle}>
                                                + {importResult.errors.length - 5} more errors
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div style={footerStyle}>
                    <button onClick={onClose} style={cancelButtonStyle}>
                        {importResult ? 'Close' : 'Cancel'}
                    </button>
                    {!importResult && (
                        <button
                            onClick={handleImport}
                            disabled={!file || importing || hasErrors}
                            style={importButtonStyle(!file || importing || hasErrors)}
                        >
                            {importing ? 'Importing...' : 'Import'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Styles
const overlayStyle: CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '20px',
};

const modalStyle: CSSProperties = {
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    borderRadius: '20px',
    maxWidth: '900px',
    width: '100%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
};

const headerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '24px',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
};

const titleStyle: CSSProperties = {
    fontSize: '24px',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
};

const closeButtonStyle: CSSProperties = {
    background: 'transparent',
    border: 'none',
    color: '#8E8E93',
    fontSize: '24px',
    cursor: 'pointer',
    padding: '8px',
    lineHeight: 1,
};

const contentStyle: CSSProperties = {
    flex: 1,
    overflowY: 'auto',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
};

const templateSectionStyle: CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
};

const downloadButtonStyle: CSSProperties = {
    background: 'rgba(52, 199, 89, 0.15)',
    border: '1px solid rgba(52, 199, 89, 0.3)',
    borderRadius: '12px',
    padding: '12px 20px',
    color: '#34C759',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
};

const hintTextStyle: CSSProperties = {
    fontSize: '13px',
    color: '#8E8E93',
    margin: 0,
};

const dropZoneStyle: CSSProperties = {
    border: '2px dashed rgba(255,255,255,0.2)',
    borderRadius: '16px',
    padding: '40px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.02)',
    transition: 'all 0.2s',
};

const fileInputStyle: CSSProperties = {
    display: 'none',
};

const dropZoneLabelStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    cursor: 'pointer',
};

const uploadIconStyle: CSSProperties = {
    fontSize: '48px',
};

const uploadTextStyle: CSSProperties = {
    fontSize: '14px',
    color: '#8E8E93',
};

const fileIconStyle: CSSProperties = {
    fontSize: '40px',
};

const fileNameStyle: CSSProperties = {
    fontSize: '14px',
    color: '#fff',
    fontWeight: 600,
};

const fileSizeStyle: CSSProperties = {
    fontSize: '12px',
    color: '#8E8E93',
};

const modeSectionStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};

const modeHeaderStyle: CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#D1D1D6',
};

const modeOptionsStyle: CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
};

const modeOptionStyle: CSSProperties = {
    display: 'flex',
    gap: '12px',
    padding: '16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    cursor: 'pointer',
};

const radioStyle: CSSProperties = {
    width: '18px',
    height: '18px',
    accentColor: '#007AFF',
    cursor: 'pointer',
};

const modeTitleStyle: CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '4px',
};

const modeDescStyle: CSSProperties = {
    fontSize: '12px',
    color: '#8E8E93',
};

const previewSectionStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
};

const previewTitleStyle: CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: '#fff',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
};

const errorBadgeStyle: CSSProperties = {
    fontSize: '11px',
    padding: '4px 8px',
    background: 'rgba(255, 59, 48, 0.15)',
    border: '1px solid rgba(255, 59, 48, 0.3)',
    borderRadius: '6px',
    color: '#FF3B30',
};

const previewTableContainerStyle: CSSProperties = {
    overflowX: 'auto',
    background: 'rgba(255,255,255,0.02)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.08)',
};

const previewTableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '13px',
};

const previewThStyle: CSSProperties = {
    padding: '12px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: 600,
    color: '#8E8E93',
    textTransform: 'uppercase',
    borderBottom: '1px solid rgba(255,255,255,0.08)',
};

const previewTrStyle = (isValid: boolean): CSSProperties => ({
    background: isValid ? 'transparent' : 'rgba(255, 59, 48, 0.05)',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
});

const previewTdStyle: CSSProperties = {
    padding: '10px 12px',
    color: '#D1D1D6',
};

const validBadgeStyle: CSSProperties = {
    fontSize: '11px',
    color: '#34C759',
    fontWeight: 600,
};

const invalidBadgeStyle: CSSProperties = {
    fontSize: '11px',
    color: '#FF3B30',
    fontWeight: 600,
    cursor: 'help',
};

const resultSectionStyle: CSSProperties = {
    padding: '20px',
    background: 'rgba(0, 122, 255, 0.08)',
    border: '1px solid rgba(0, 122, 255, 0.2)',
    borderRadius: '12px',
};

const resultTitleStyle: CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '16px',
};

const resultStatsStyle: CSSProperties = {
    display: 'flex',
    gap: '24px',
    marginBottom: '16px',
};

const resultStatStyle: CSSProperties = {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
};

const resultStatLabelStyle: CSSProperties = {
    fontSize: '13px',
    color: '#8E8E93',
};

const resultStatValueStyle = (isSuccess: boolean): CSSProperties => ({
    fontSize: '18px',
    fontWeight: 700,
    color: isSuccess ? '#34C759' : '#FF9500',
});

const errorListContainerStyle: CSSProperties = {
    marginTop: '12px',
};

const errorListTitleStyle: CSSProperties = {
    fontSize: '13px',
    fontWeight: 600,
    color: '#FF3B30',
    marginBottom: '8px',
};

const errorListStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
};

const errorItemStyle: CSSProperties = {
    fontSize: '12px',
    color: '#FFD60A',
    padding: '8px 12px',
    background: 'rgba(255, 59, 48, 0.1)',
    borderRadius: '6px',
};

const errorMoreStyle: CSSProperties = {
    fontSize: '12px',
    color: '#8E8E93',
    fontStyle: 'italic',
    padding: '8px 12px',
};

const footerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '24px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
};

const cancelButtonStyle: CSSProperties = {
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: '12px',
    padding: '12px 24px',
    color: '#fff',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
};

const importButtonStyle = (disabled: boolean): CSSProperties => ({
    background: disabled ? 'rgba(0, 122, 255, 0.05)' : 'rgba(0, 122, 255, 0.15)',
    border: `1px solid ${disabled ? 'rgba(0, 122, 255, 0.1)' : 'rgba(0, 122, 255, 0.3)'}`,
    borderRadius: '12px',
    padding: '12px 24px',
    color: disabled ? '#636366' : '#007AFF',
    fontSize: '14px',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
});
