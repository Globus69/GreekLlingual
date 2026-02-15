'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import type { ImportPreviewRow, BulkImportResult } from '@/types/content';
import { parseCSV, generateCSVTemplate, exportContentAsCSV } from '@/lib/supabase/content';
import { Download, Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import type { ContentFilters } from '@/types/content';

interface ImportExportSectionProps {
    onImport: (items: any[]) => Promise<BulkImportResult>;
    filters?: ContentFilters;
}

export function ImportExportSection({ onImport, filters }: ImportExportSectionProps) {
    const [previewData, setPreviewData] = useState<ImportPreviewRow[]>([]);
    const [isImporting, setIsImporting] = useState(false);
    const [isExporting, setIsExporting] = useState(false);
    const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        const csv = generateCSVTemplate();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'content-template.csv';
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const text = e.target?.result as string;
            const parsed = parseCSV(text);
            setPreviewData(parsed);
            setImportResult(null);
        };
        reader.readAsText(file);
    };

    const handleImport = async () => {
        const validItems = previewData.filter((row) => row._isValid);
        if (validItems.length === 0) {
            alert('No valid items to import. Please fix errors first.');
            return;
        }

        setIsImporting(true);
        try {
            const result = await onImport(validItems);
            setImportResult(result);
            if (result.success > 0) {
                setPreviewData([]);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            }
        } catch (error) {
            console.error('Import error:', error);
        } finally {
            setIsImporting(false);
        }
    };

    const handleExport = async () => {
        setIsExporting(true);
        try {
            const { csv, error } = await exportContentAsCSV(filters);
            if (error) throw error;

            const blob = new Blob([csv], { type: 'text/csv' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `content-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Export error:', error);
            alert('Failed to export data');
        } finally {
            setIsExporting(false);
        }
    };

    const validCount = previewData.filter((row) => row._isValid).length;
    const invalidCount = previewData.length - validCount;

    return (
        <div className="space-y-6">
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Download Template */}
                <Card className="glass-card hover:bg-accent/10 transition-colors cursor-pointer" onClick={handleDownloadTemplate}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/20">
                                <FileText className="h-5 w-5 text-blue-400" />
                            </div>
                            <CardTitle className="text-lg">Template</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription>
                            Download CSV template with example data
                        </CardDescription>
                    </CardContent>
                </Card>

                {/* Upload File */}
                <Card className="glass-card hover:bg-accent/10 transition-colors">
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-green-500/20">
                                <Upload className="h-5 w-5 text-green-400" />
                            </div>
                            <CardTitle className="text-lg">Import</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload">
                            <Button variant="outline" className="w-full cursor-pointer" asChild>
                                <span>Choose CSV File</span>
                            </Button>
                        </label>
                    </CardContent>
                </Card>

                {/* Export */}
                <Card className="glass-card hover:bg-accent/10 transition-colors cursor-pointer" onClick={handleExport}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-500/20">
                                <Download className="h-5 w-5 text-purple-400" />
                            </div>
                            <CardTitle className="text-lg">Export</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <CardDescription className="flex items-center gap-2">
                            {isExporting ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                'Download all content as CSV'
                            )}
                        </CardDescription>
                    </CardContent>
                </Card>
            </div>

            {/* Preview Table */}
            {previewData.length > 0 && (
                <Card className="glass-card">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Import Preview</CardTitle>
                                <CardDescription className="mt-2">
                                    {validCount} valid, {invalidCount} invalid items
                                </CardDescription>
                            </div>
                            <Button
                                onClick={handleImport}
                                disabled={isImporting || validCount === 0}
                                className="gap-2"
                            >
                                {isImporting && <Loader2 className="h-4 w-4 animate-spin" />}
                                Import {validCount} Items
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="max-h-96 overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-12">#</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>English</TableHead>
                                        <TableHead>Greek</TableHead>
                                        <TableHead>Level</TableHead>
                                        <TableHead>Difficulty</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewData.map((row, index) => (
                                        <TableRow
                                            key={index}
                                            className={row._isValid ? '' : 'bg-red-500/10'}
                                        >
                                            <TableCell>{row._rowIndex}</TableCell>
                                            <TableCell>{row.type}</TableCell>
                                            <TableCell className="max-w-xs truncate">{row.english}</TableCell>
                                            <TableCell className="max-w-xs truncate">{row.greek}</TableCell>
                                            <TableCell>{row.level}</TableCell>
                                            <TableCell>{row.difficulty}</TableCell>
                                            <TableCell>
                                                {row._isValid ? (
                                                    <span className="text-green-400 text-xs">✓ Valid</span>
                                                ) : (
                                                    <div className="flex items-center gap-1 text-red-400 text-xs">
                                                        <AlertCircle className="h-3 w-3" />
                                                        {row._errors?.join(', ')}
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Import Result */}
            {importResult && (
                <Card className={`glass-card ${importResult.success > 0 ? 'border-green-500/50' : 'border-red-500/50'}`}>
                    <CardHeader>
                        <CardTitle className={importResult.success > 0 ? 'text-green-400' : 'text-red-400'}>
                            Import {importResult.success > 0 ? 'Successful' : 'Failed'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 text-sm">
                            <p>✓ Successfully imported: {importResult.success} items</p>
                            {importResult.failed > 0 && (
                                <p className="text-red-400">✗ Failed: {importResult.failed} items</p>
                            )}
                            {importResult.errors.length > 0 && (
                                <div className="mt-4 space-y-1">
                                    <p className="font-semibold">Errors:</p>
                                    {importResult.errors.map((error, idx) => (
                                        <p key={idx} className="text-red-400 text-xs">
                                            Row {error.row}: {error.message}
                                        </p>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
