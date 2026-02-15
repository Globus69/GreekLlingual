'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { supabase } from '@/db/supabase';

interface ImportItem {
    type: 'vocabulary' | 'phrase' | 'grammar';
    english: string;
    greek: string;
    phonetic?: string;
    example_en?: string;
    example_gr?: string;
    level: string;
    difficulty: string;
    audio_url?: string;
}

export default function AdminImportPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [file, setFile] = useState<File | null>(null);
    const [importType, setImportType] = useState<'csv' | 'json'>('csv');
    const [preview, setPreview] = useState<ImportItem[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [result, setResult] = useState<{ success: number; errors: number } | null>(null);
    const [errors, setErrors] = useState<string[]>([]);

    // Check admin access
    if (!user || user.role !== 'admin') {
        router.push('/login');
        return null;
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setShowPreview(false);
            setPreview([]);
            setResult(null);
            setErrors([]);
        }
    };

    const parseCSV = (text: string): ImportItem[] => {
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim());

        return lines.slice(1).map(line => {
            const values = line.split(',').map(v => v.trim());
            const item: any = {};

            headers.forEach((header, index) => {
                item[header] = values[index] || '';
            });

            return {
                type: item.type || 'vocabulary',
                english: item.english || '',
                greek: item.greek || '',
                phonetic: item.phonetic || '',
                example_en: item.example_en || '',
                example_gr: item.example_gr || '',
                level: item.level || 'A1',
                difficulty: item.difficulty || 'easy',
                audio_url: item.audio_url || ''
            };
        });
    };

    const parseJSON = (text: string): ImportItem[] => {
        try {
            const data = JSON.parse(text);
            return Array.isArray(data) ? data : [data];
        } catch (err) {
            throw new Error('Invalid JSON format');
        }
    };

    const validateItem = (item: ImportItem, index: number): string | null => {
        if (!item.english || !item.greek) {
            return `Row ${index + 1}: Missing required fields (english, greek)`;
        }
        if (!['vocabulary', 'phrase', 'grammar'].includes(item.type)) {
            return `Row ${index + 1}: Invalid type (must be: vocabulary, phrase, grammar)`;
        }
        if (!['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(item.level)) {
            return `Row ${index + 1}: Invalid level (must be: A1, A2, B1, B2, C1, C2)`;
        }
        if (!['easy', 'medium', 'hard'].includes(item.difficulty)) {
            return `Row ${index + 1}: Invalid difficulty (must be: easy, medium, hard)`;
        }
        return null;
    };

    const handlePreview = async () => {
        if (!file) return;

        try {
            const text = await file.text();
            let items: ImportItem[];

            if (importType === 'csv') {
                items = parseCSV(text);
            } else {
                items = parseJSON(text);
            }

            // Validate all items
            const validationErrors: string[] = [];
            items.forEach((item, index) => {
                const error = validateItem(item, index);
                if (error) validationErrors.push(error);
            });

            setErrors(validationErrors);
            setPreview(items);
            setShowPreview(true);
        } catch (err) {
            setErrors([`Parse error: ${err instanceof Error ? err.message : 'Unknown error'}`]);
        }
    };

    const handleImport = async () => {
        if (preview.length === 0 || errors.length > 0) return;

        setImporting(true);
        setProgress(0);

        let successCount = 0;
        let errorCount = 0;
        const importErrors: string[] = [];

        for (let i = 0; i < preview.length; i++) {
            const item = preview[i];

            try {
                const { error } = await supabase
                    .from('learning_items')
                    .insert({
                        type: item.type,
                        english: item.english,
                        greek: item.greek,
                        phonetic: item.phonetic || null,
                        example_en: item.example_en || null,
                        example_gr: item.example_gr || null,
                        level: item.level,
                        difficulty: item.difficulty,
                        audio_url: item.audio_url || null
                    });

                if (error) {
                    errorCount++;
                    importErrors.push(`Row ${i + 1}: ${error.message}`);
                } else {
                    successCount++;
                }
            } catch (err) {
                errorCount++;
                importErrors.push(`Row ${i + 1}: ${err instanceof Error ? err.message : 'Unknown error'}`);
            }

            setProgress(Math.round(((i + 1) / preview.length) * 100));
        }

        setResult({ success: successCount, errors: errorCount });
        setErrors(importErrors);
        setImporting(false);
    };

    const resetForm = () => {
        setFile(null);
        setPreview([]);
        setShowPreview(false);
        setResult(null);
        setErrors([]);
        setProgress(0);
    };

    return (
        <div className="min-h-screen p-8" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
                    <h1 className="text-3xl font-bold text-white mb-2">📦 Import Vocabulary & Phrases</h1>
                    <p className="text-blue-200">Bulk import your own content (CSV or JSON)</p>
                </div>

                {/* Upload Section */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">1. Upload File</h2>

                    {/* Format Selection */}
                    <div className="mb-4">
                        <label className="text-white font-semibold mb-2 block">Format:</label>
                        <div className="flex gap-4">
                            <label className="flex items-center text-white cursor-pointer">
                                <input
                                    type="radio"
                                    value="csv"
                                    checked={importType === 'csv'}
                                    onChange={(e) => setImportType(e.target.value as 'csv')}
                                    className="mr-2"
                                />
                                CSV
                            </label>
                            <label className="flex items-center text-white cursor-pointer">
                                <input
                                    type="radio"
                                    value="json"
                                    checked={importType === 'json'}
                                    onChange={(e) => setImportType(e.target.value as 'json')}
                                    className="mr-2"
                                />
                                JSON
                            </label>
                        </div>
                    </div>

                    {/* File Input */}
                    <input
                        type="file"
                        accept={importType === 'csv' ? '.csv' : '.json'}
                        onChange={handleFileChange}
                        className="block w-full text-white bg-white/20 rounded-lg p-3 mb-4"
                    />

                    {file && (
                        <p className="text-white mb-4">
                            Selected: <span className="font-semibold">{file.name}</span> ({(file.size / 1024).toFixed(2)} KB)
                        </p>
                    )}

                    <button
                        onClick={handlePreview}
                        disabled={!file}
                        className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold"
                    >
                        Preview Import
                    </button>
                </div>

                {/* Format Guide */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
                    <h2 className="text-xl font-bold text-white mb-4">📋 Format Guide</h2>

                    <div className="text-white space-y-4">
                        <div>
                            <h3 className="font-bold mb-2">CSV Format (with headers):</h3>
                            <pre className="bg-black/30 p-3 rounded text-sm overflow-x-auto">
type,english,greek,phonetic,example_en,example_gr,level,difficulty,audio_url
vocabulary,Hello,Γεια σου,YAH-soo,Hello friend,Γεια σου φίλε,A1,easy,
vocabulary,Water,Νερό,neh-ROH,I want water,Θέλω νερό,A1,easy,
phrase,How are you?,Πώς είσαι;,pos EE-seh,How are you today?,Πώς είσαι σήμερα;,A1,medium,
                            </pre>
                        </div>

                        <div>
                            <h3 className="font-bold mb-2">JSON Format:</h3>
                            <pre className="bg-black/30 p-3 rounded text-sm overflow-x-auto">
{`[
  {
    "type": "vocabulary",
    "english": "Hello",
    "greek": "Γεια σου",
    "phonetic": "YAH-soo",
    "example_en": "Hello friend",
    "example_gr": "Γεια σου φίλε",
    "level": "A1",
    "difficulty": "easy"
  }
]`}
                            </pre>
                        </div>

                        <div>
                            <h3 className="font-bold mb-2">Required Fields:</h3>
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong>type:</strong> vocabulary, phrase, grammar</li>
                                <li><strong>english:</strong> English translation</li>
                                <li><strong>greek:</strong> Greek text</li>
                                <li><strong>level:</strong> A1, A2, B1, B2, C1, C2</li>
                                <li><strong>difficulty:</strong> easy, medium, hard</li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="font-bold mb-2">Optional Fields:</h3>
                            <ul className="list-disc list-inside space-y-1">
                                <li><strong>phonetic:</strong> Pronunciation guide</li>
                                <li><strong>example_en:</strong> Example sentence (English)</li>
                                <li><strong>example_gr:</strong> Example sentence (Greek)</li>
                                <li><strong>audio_url:</strong> URL to audio file</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Preview Section */}
                {showPreview && (
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
                        <h2 className="text-xl font-bold text-white mb-4">2. Preview ({preview.length} items)</h2>

                        {/* Validation Errors */}
                        {errors.length > 0 && (
                            <div className="bg-red-500/20 border border-red-500 rounded-lg p-4 mb-4">
                                <h3 className="text-white font-bold mb-2">⚠️ Validation Errors:</h3>
                                <ul className="text-white text-sm space-y-1">
                                    {errors.slice(0, 10).map((error, i) => (
                                        <li key={i}>• {error}</li>
                                    ))}
                                    {errors.length > 10 && (
                                        <li className="font-semibold">... and {errors.length - 10} more errors</li>
                                    )}
                                </ul>
                            </div>
                        )}

                        {/* Preview Table */}
                        {preview.length > 0 && (
                            <div className="overflow-x-auto mb-4">
                                <table className="w-full text-white text-sm">
                                    <thead>
                                        <tr className="border-b border-white/20">
                                            <th className="text-left p-2">#</th>
                                            <th className="text-left p-2">Type</th>
                                            <th className="text-left p-2">English</th>
                                            <th className="text-left p-2">Greek</th>
                                            <th className="text-left p-2">Level</th>
                                            <th className="text-left p-2">Difficulty</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {preview.slice(0, 10).map((item, i) => (
                                            <tr key={i} className="border-b border-white/10">
                                                <td className="p-2">{i + 1}</td>
                                                <td className="p-2">{item.type}</td>
                                                <td className="p-2">{item.english}</td>
                                                <td className="p-2">{item.greek}</td>
                                                <td className="p-2">{item.level}</td>
                                                <td className="p-2">{item.difficulty}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                {preview.length > 10 && (
                                    <p className="text-white text-center mt-2">... and {preview.length - 10} more items</p>
                                )}
                            </div>
                        )}

                        {/* Import Button */}
                        {errors.length === 0 && (
                            <button
                                onClick={handleImport}
                                disabled={importing}
                                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-500 text-white px-6 py-3 rounded-lg font-semibold"
                            >
                                {importing ? 'Importing...' : `Import ${preview.length} Items`}
                            </button>
                        )}
                    </div>
                )}

                {/* Progress */}
                {importing && (
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
                        <h2 className="text-xl font-bold text-white mb-4">Importing...</h2>
                        <div className="bg-white/20 rounded-full h-4 mb-2">
                            <div
                                className="bg-green-500 h-4 rounded-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <p className="text-white text-center">{progress}%</p>
                    </div>
                )}

                {/* Result */}
                {result && (
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 mb-6">
                        <h2 className="text-xl font-bold text-white mb-4">✅ Import Complete!</h2>
                        <div className="text-white space-y-2">
                            <p><strong>Success:</strong> {result.success} items imported</p>
                            <p><strong>Errors:</strong> {result.errors} items failed</p>
                        </div>

                        {errors.length > 0 && (
                            <div className="mt-4 bg-red-500/20 border border-red-500 rounded-lg p-4">
                                <h3 className="text-white font-bold mb-2">Error Details:</h3>
                                <ul className="text-white text-sm space-y-1 max-h-60 overflow-y-auto">
                                    {errors.map((error, i) => (
                                        <li key={i}>• {error}</li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        <button
                            onClick={resetForm}
                            className="mt-4 bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold"
                        >
                            Import More
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
