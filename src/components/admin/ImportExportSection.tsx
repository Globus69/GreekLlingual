'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
    generateTemplateCSV,
    importFromCSV,
    bulkImport,
} from '@/lib/supabase/content';
import { Download, Upload, FileText, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface ImportExportSectionProps {
    onImportSuccess: () => void;
    onExport: () => void;
}

export function ImportExportSection({
    onImportSuccess,
    onExport,
}: ImportExportSectionProps) {
    const [previewData, setPreviewData] = useState<{
        validItems: any[];
        invalidItems: { row: number; errors: string[] }[];
    } | null>(null);
    const [isImporting, setIsImporting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleDownloadTemplate = () => {
        const csv = generateTemplateCSV();
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'content-template.csv';
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Template heruntergeladen');
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            const result = await importFromCSV(file);
            setPreviewData(result);
            toast.info(
                `${result.validItems.length} gültige, ${result.invalidItems.length} ungültige Einträge`
            );
        } catch (error) {
            toast.error('Fehler beim Parsen der CSV-Datei');
            console.error(error);
        }
    };

    const handleImport = async () => {
        if (!previewData || previewData.validItems.length === 0) {
            toast.error('Keine gültigen Einträge zum Importieren');
            return;
        }

        setIsImporting(true);
        try {
            const result = await bulkImport(previewData.validItems);
            if (result.success > 0) {
                toast.success(`${result.success} Einträge erfolgreich importiert`);
                setPreviewData(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
                onImportSuccess();
            }
            if (result.errors.length > 0) {
                toast.error(`Fehler: ${result.errors.join(', ')}`);
            }
        } catch (error) {
            toast.error('Import fehlgeschlagen');
            console.error(error);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div className="space-y-3 mb-4">
            {/* Simple Action Buttons */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadTemplate}
                        className="h-8 text-xs border-gray-300 hover:bg-gray-50"
                    >
                        <FileText className="h-3.5 w-3.5 mr-1.5" />
                        Template
                    </Button>

                    <div className="relative">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv"
                            onChange={handleFileUpload}
                            className="hidden"
                            id="file-upload"
                        />
                        <label htmlFor="file-upload">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-8 text-xs border-gray-300 hover:bg-gray-50 cursor-pointer"
                                asChild
                            >
                                <span>
                                    <Upload className="h-3.5 w-3.5 mr-1.5" />
                                    Datei auswählen
                                </span>
                            </Button>
                        </label>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onExport}
                        className="h-8 text-xs border-gray-300 hover:bg-gray-50"
                    >
                        <Download className="h-3.5 w-3.5 mr-1.5" />
                        Export
                    </Button>

                    <span className="text-xs text-gray-500 ml-2">
                        CSV-Vorlage mit Beispieldaten herunterladen
                    </span>
                </div>
            </div>

            {/* Preview Table */}
            {previewData && (
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between bg-gray-50">
                        <div className="text-sm">
                            <span className="font-semibold text-gray-900">Import-Vorschau</span>
                            <span className="text-gray-500 ml-3">
                                <span className="text-green-600 font-medium">
                                    {previewData.validItems.length} gültig
                                </span>
                                {previewData.invalidItems.length > 0 && (
                                    <>
                                        {' · '}
                                        <span className="text-red-600 font-medium">
                                            {previewData.invalidItems.length} ungültig
                                        </span>
                                    </>
                                )}
                            </span>
                        </div>
                        <Button
                            onClick={handleImport}
                            disabled={isImporting || previewData.validItems.length === 0}
                            size="sm"
                            className="h-8 text-xs bg-blue-500 hover:bg-blue-600"
                        >
                            {isImporting && <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />}
                            {previewData.validItems.length} Einträge importieren
                        </Button>
                    </div>

                    <div className="max-h-96 overflow-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 sticky top-0">
                                <tr className="border-b border-gray-200">
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Status</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Type</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">English</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Greek</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Level</th>
                                    <th className="px-4 py-2 text-left text-xs font-semibold text-gray-600">Difficulty</th>
                                </tr>
                            </thead>
                            <tbody>
                                {/* Valid Items */}
                                {previewData.validItems.map((item, index) => (
                                    <tr key={`valid-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="px-4 py-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-600">{item.type}</td>
                                        <td className="px-4 py-2 text-sm text-gray-900 max-w-xs truncate">
                                            {item.english}
                                        </td>
                                        <td className="px-4 py-2 text-sm text-blue-600 max-w-xs truncate">
                                            {item.greek}
                                        </td>
                                        <td className="px-4 py-2 text-xs text-gray-600">{item.level}</td>
                                        <td className="px-4 py-2 text-xs text-gray-600">{item.difficulty}</td>
                                    </tr>
                                ))}
                                {/* Invalid Items */}
                                {previewData.invalidItems.map((item) => (
                                    <tr
                                        key={`invalid-${item.row}`}
                                        className="border-b border-gray-100 bg-red-50"
                                    >
                                        <td className="px-4 py-2">
                                            <AlertCircle className="h-4 w-4 text-red-500" />
                                        </td>
                                        <td colSpan={5} className="px-4 py-2 text-xs text-red-600">
                                            Zeile {item.row}: {item.errors.join(', ')}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}
