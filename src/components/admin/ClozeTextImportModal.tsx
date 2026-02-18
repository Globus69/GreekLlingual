'use client';

import React, { useState, CSSProperties } from 'react';
import type { ImportMode, ImportResult, ClozeTextCSVRow } from '@/types/cloze-text';
import { importCSV, downloadTemplate } from '@/lib/api/cloze-text';
import { toast } from 'sonner';
import Papa from 'papaparse';

interface ClozeTextImportModalProps {
    onClose: () => void;
    onSuccess: () => void;
}

export default function ClozeTextImportModal({ onClose, onSuccess }: ClozeTextImportModalProps) {
    const [file, setFile] = useState<File | null>(null);
    const [mode, setMode] = useState<ImportMode>('append');
    const [importing, setImporting] = useState(false);
    const [previewData, setPreviewData] = useState<ClozeTextCSVRow[]>([]);
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
        Papa.parse<ClozeTextCSVRow>(file, {
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

    const validatePreview = (data: ClozeTextCSVRow[]) => {
        const errors = new Map<number, string[]>();

        data.forEach((row, index) => {
            const rowErrors: string[] = [];

            if (!row.greek_transcription || row.greek_transcription.trim() === '') {
                rowErrors.push('Greek transcription required');
            }

            if (!row.cloze_answer || row.cloze_answer.trim() === '') {
                rowErrors.push('Cloze answer required');
            }

            if (!row.level || !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(row.level)) {
                rowErrors.push('Valid level required');
            }

            if (!row.difficulty || !['easy', 'medium', 'hard', 'middle'].includes(row.difficulty.toLowerCase())) {
                rowErrors.push('Valid difficulty required');
            }

            const freq = parseInt(row.frequency);
            if (isNaN(freq) || freq < 1 || freq > 5) {
                rowErrors.push('Frequency must be 1-5');
            }

            if (rowErrors.length > 0) {
                errors.set(index, rowErrors);
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
                '⚠️ WARNING: This will DELETE ALL existing cloze texts and replace them with the imported data.\n\nThis action cannot be undone. Continue?'
            );
            if (!confirmed) return;
        }

        try {
            setImporting(true);
            const result = await importCSV(file, mode);
            setImportResult(result);

            if (result.success) {
                toast.success(`Import complete: ${result.imported} cloze texts imported`);
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
                    <h2 style={titleStyle}>Import Cloze Texts CSV</h2>
                    <button onClick={onClose} style={closeButtonStyle}>
                        ✕
                    </button>
                </div>

                {/* Content */}
                <div style={contentStyle}>
                    {/* Download Template */}
                    <div style={templateSectionStyle}>
                        <button onClick={downloadTemplate} style={downloadButtonStyle}>
                            📥 Download CSV Template
                        </button>
                        <p style={hintTextStyle}>
                            Download the template to see the required CSV format
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
                                    <div style={modeDescStyle}>Add new cloze texts (keep existing)</div>
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
                                    <div style={modeTitleStyle}>Overwrite ⚠️</div>
                                    <div style={modeDescStyle}>Delete all and import (destructive!)</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    {/* Preview */}
                    {previewData.length > 0 && (
                        <div style={previewSectionStyle}>
                            <h3 style={previewTitleStyle}>
                                Preview (first {previewData.length} rows)
                                {hasErrors && <span style={errorBadgeStyle}> {validationErrors.size} errors</span>}
                            </h3>
                            <div style={previewTableContainerStyle}>
                                <table style={previewTableStyle}>
                                    <thead>
                                        <tr>
                                            <th style={previewThStyle}>#</th>
                                            <th style={previewThStyle}>Greek</th>
                                            <th style={previewThStyle}>Answer</th>
                                            <th style={previewThStyle}>Level</th>
                                            <th style={previewThStyle}>Difficulty</th>
                                            <th style={previewThStyle}>Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {previewData.map((row, index) => {
                                            const hasError = validationErrors.has(index);
                                            return (
                                                <tr key={index} style={previewTrStyle(hasError)}>
                                                    <td style={previewTdStyle}>{index + 1}</td>
                                                    <td style={previewTdStyle}>
                                                        {row.greek_transcription?.substring(0, 40) || '—'}
                                                    </td>
                                                    <td style={previewTdStyle}>{row.cloze_answer || '—'}</td>
                                                    <td style={previewTdStyle}>{row.level || '—'}</td>
                                                    <td style={previewTdStyle}>{row.difficulty || '—'}</td>
                                                    <td style={previewTdStyle}>
                                                        {hasError ? (
                                                            <span style={statusInvalidStyle} title={validationErrors.get(index)?.join(', ')}>
                                                                ✗ Invalid
                                                            </span>
                                                        ) : (
                                                            <span style={statusValidStyle}>✓ Valid</span>
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
                        <div style={resultBoxStyle(importResult.success)}>
                            <div style={resultTitleStyle}>
                                {importResult.success ? '✅ Import Successful' : '⚠️ Import Completed with Errors'}
                            </div>
                            <div style={resultStatsStyle}>
                                <div>✓ Imported: {importResult.imported}</div>
                                <div>⏭ Skipped: {importResult.skipped}</div>
                                {importResult.errors.length > 0 && (
                                    <div>❌ Errors: {importResult.errors.length}</div>
                                )}
                            </div>
                            {importResult.errors.length > 0 && (
                                <div style={resultErrorsStyle}>
                                    <div style={resultErrorsTitleStyle}>Error Details:</div>
                                    {importResult.errors.slice(0, 5).map((err, i) => (
                                        <div key={i} style={resultErrorItemStyle}>
                                            Row {err.row}: {err.message}
                                        </div>
                                    ))}
                                    {importResult.errors.length > 5 && (
                                        <div style={resultErrorMoreStyle}>
                                            ... and {importResult.errors.length - 5} more errors
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Import Button */}
                    <div style={footerStyle}>
                        <button type="button" onClick={onClose} style={cancelButtonStyle}>
                            Cancel
                        </button>
                        <button
                            onClick={handleImport}
                            disabled={!file || importing || hasErrors}
                            style={importButtonStyle(importing, hasErrors)}
                        >
                            {importing ? 'Importing...' : hasErrors ? 'Fix Errors First' : `Import ${previewData.length > 0 ? `(${previewData.length}+ rows)` : ''}`}
                        </button>
                    </div>
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
    textAlign: 'center',
};

const downloadButtonStyle: CSSProperties = {
    background: 'rgba(138, 43, 226, 0.15)',
    border: '1px solid rgba(138, 43, 226, 0.3)',
    borderRadius: '12px',
    padding: '12px 20px',
    color: '#8A2BE2',
    fontSize: '14px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s',
};

const hintTextStyle: CSSProperties = {
    fontSize: '12px',
    color: '#8E8E93',
    marginTop: '8px',
};

const dropZoneStyle: CSSProperties = {
    border: '2px dashed rgba(255,255,255,0.2)',
    borderRadius: '12px',
    padding: '32px',
    textAlign: 'center',
    background: 'rgba(255,255,255,0.02)',
    transition: 'all 0.2s',
    cursor: 'pointer',
};

const fileInputStyle: CSSProperties = {
    display: 'none',
};

const dropZoneLabelStyle: CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    alignItems: 'center',
    cursor: 'pointer',
};

const fileIconStyle: CSSProperties = {
    fontSize: '48px',
};

const fileNameStyle: CSSProperties = {
    fontSize: '16px',
    fontWeight: 600,
    color: '#fff',
};

const fileSizeStyle: CSSProperties = {
    fontSize: '12px',
    color: '#8E8E93',
};

const uploadIconStyle: CSSProperties = {
    fontSize: '48px',
    opacity: 0.5,
};

const uploadTextStyle: CSSProperties = {
    fontSize: '14px',
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
    display: 'flex',
    gap: '12px',
};

const modeOptionStyle: CSSProperties = {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
    padding: '16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '10px',
    cursor: 'pointer',
    flex: 1,
};

const radioStyle: CSSProperties = {
    width: '18px',
    height: '18px',
    accentColor: '#8A2BE2',
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
    background: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    padding: '16px',
    border: '1px solid rgba(255,255,255,0.08)',
};

const previewTitleStyle: CSSProperties = {
    fontSize: '14px',
    fontWeight: 600,
    color: '#fff',
    marginBottom: '12px',
};

const errorBadgeStyle: CSSProperties = {
    color: '#FF3B30',
    fontSize: '12px',
};

const previewTableContainerStyle: CSSProperties = {
    overflowX: 'auto',
};

const previewTableStyle: CSSProperties = {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '12px',
};

const previewThStyle: CSSProperties = {
    padding: '8px',
    textAlign: 'left',
    borderBottom: '1px solid rgba(255,255,255,0.1)',
    color: '#8E8E93',
    fontWeight: 600,
};

const previewTrStyle = (hasError: boolean): CSSProperties => ({
    borderBottom: '1px solid rgba(255,255,255,0.05)',
    background: hasError ? 'rgba(255, 59, 48, 0.05)' : 'transparent',
});

const previewTdStyle: CSSProperties = {
    padding: '8px',
    color: '#D1D1D6',
};

const statusValidStyle: CSSProperties = {
    color: '#34C759',
    fontSize: '12px',
};

const statusInvalidStyle: CSSProperties = {
    color: '#FF3B30',
    fontSize: '12px',
    cursor: 'help',
};

const resultBoxStyle = (success: boolean): CSSProperties => ({
    padding: '16px',
    background: success ? 'rgba(52, 199, 89, 0.1)' : 'rgba(255, 214, 10, 0.1)',
    border: `1px solid ${success ? 'rgba(52, 199, 89, 0.3)' : 'rgba(255, 214, 10, 0.3)'}`,
    borderRadius: '12px',
});

const resultTitleStyle: CSSProperties = {
    fontSize: '16px',
    fontWeight: 700,
    color: '#fff',
    marginBottom: '12px',
};

const resultStatsStyle: CSSProperties = {
    display: 'flex',
    gap: '16px',
    fontSize: '13px',
    color: '#D1D1D6',
};

const resultErrorsStyle: CSSProperties = {
    marginTop: '12px',
    paddingTop: '12px',
    borderTop: '1px solid rgba(255,255,255,0.1)',
};

const resultErrorsTitleStyle: CSSProperties = {
    fontSize: '12px',
    fontWeight: 600,
    color: '#FF3B30',
    marginBottom: '8px',
};

const resultErrorItemStyle: CSSProperties = {
    fontSize: '11px',
    color: '#FF9F8C',
    padding: '4px 0',
};

const resultErrorMoreStyle: CSSProperties = {
    fontSize: '11px',
    color: '#8E8E93',
    marginTop: '4px',
    fontStyle: 'italic',
};

const footerStyle: CSSProperties = {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    paddingTop: '16px',
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

const importButtonStyle = (importing: boolean, hasErrors: boolean): CSSProperties => ({
    background: hasErrors ? 'rgba(255, 59, 48, 0.15)' : 'rgba(138, 43, 226, 0.15)',
    border: hasErrors ? '1px solid rgba(255, 59, 48, 0.3)' : '1px solid rgba(138, 43, 226, 0.3)',
    borderRadius: '12px',
    padding: '12px 24px',
    color: hasErrors ? '#FF3B30' : '#8A2BE2',
    fontSize: '14px',
    fontWeight: 600,
    cursor: importing || hasErrors ? 'not-allowed' : 'pointer',
    opacity: importing || hasErrors ? 0.5 : 1,
});
