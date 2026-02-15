'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { Content } from '@/types/content';
import { Pencil, Trash2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { bulkDeleteContent } from '@/lib/supabase/content';

interface ContentTableProps {
    data: Content[];
    loading: boolean;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onEdit: (item: Content) => void;
    onDelete: (id: string) => void;
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function ContentTable({
    data,
    loading,
    selectedIds,
    onSelectionChange,
    onEdit,
    onDelete,
    page,
    totalPages,
    onPageChange,
}: ContentTableProps) {
    const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            onSelectionChange(data.map((item) => item.id));
        } else {
            onSelectionChange([]);
        }
    };

    const handleSelectOne = (id: string, checked: boolean) => {
        if (checked) {
            onSelectionChange([...selectedIds, id]);
        } else {
            onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
        }
    };

    const handleBulkDelete = async () => {
        if (selectedIds.length === 0) return;

        if (!confirm(`${selectedIds.length} Einträge wirklich löschen?`)) return;

        try {
            await bulkDeleteContent(selectedIds);
            toast.success(`${selectedIds.length} Einträge gelöscht`);
            onSelectionChange([]);
            window.location.reload();
        } catch (error) {
            toast.error('Fehler beim Löschen');
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Eintrag wirklich löschen?')) return;

        setDeletingIds(new Set(deletingIds).add(id));
        try {
            await onDelete(id);
        } finally {
            const newSet = new Set(deletingIds);
            newSet.delete(id);
            setDeletingIds(newSet);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">Lade Daten...</p>
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
                <p className="text-sm text-gray-600 mb-1">Keine Einträge gefunden</p>
                <p className="text-xs text-gray-400">
                    Passen Sie die Filter an oder erstellen Sie einen neuen Eintrag
                </p>
            </div>
        );
    }

    const allSelected = data.length > 0 && selectedIds.length === data.length;
    const someSelected = selectedIds.length > 0 && selectedIds.length < data.length;

    return (
        <div className="space-y-3">
            {/* Bulk Actions */}
            {selectedIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 flex items-center justify-between">
                    <span className="text-sm text-blue-900 font-medium">
                        {selectedIds.length} ausgewählt
                    </span>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="h-7 text-xs"
                    >
                        <Trash2 className="h-3 w-3 mr-1" />
                        Löschen
                    </Button>
                </div>
            )}

            {/* Table */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-50 hover:bg-gray-50">
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={allSelected}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all"
                                    className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                />
                            </TableHead>
                            <TableHead className="text-xs font-semibold text-gray-600">Type</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-600">English</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-600">Greek</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-600">Level</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-600">Difficulty</TableHead>
                            <TableHead className="text-xs font-semibold text-gray-600">Created</TableHead>
                            <TableHead className="w-24 text-xs font-semibold text-gray-600">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((item) => (
                            <TableRow
                                key={item.id}
                                className="hover:bg-gray-50 border-b border-gray-100"
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.includes(item.id)}
                                        onCheckedChange={(checked) =>
                                            handleSelectOne(item.id, checked as boolean)
                                        }
                                        aria-label={`Select ${item.english}`}
                                        className="data-[state=checked]:bg-blue-500 data-[state=checked]:border-blue-500"
                                    />
                                </TableCell>
                                <TableCell className="text-xs text-gray-600 capitalize">
                                    {item.type}
                                </TableCell>
                                <TableCell className="text-sm text-gray-900 max-w-xs">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="truncate block cursor-help">
                                                    {item.english}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">{item.english}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-sm text-blue-600 max-w-xs">
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger asChild>
                                                <span className="truncate block cursor-help">
                                                    {item.greek}
                                                </span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p className="max-w-xs">{item.greek}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                </TableCell>
                                <TableCell className="text-xs text-gray-600">
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                        {item.level}
                                    </span>
                                </TableCell>
                                <TableCell className="text-xs text-gray-600 capitalize">
                                    {item.difficulty}
                                </TableCell>
                                <TableCell className="text-xs text-gray-500">
                                    {format(new Date(item.created_at), 'dd.MM.yyyy')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(item)}
                                            className="h-7 w-7 text-gray-600 hover:text-blue-600 hover:bg-blue-50"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleDelete(item.id)}
                                            disabled={deletingIds.has(item.id)}
                                            className="h-7 w-7 text-gray-600 hover:text-red-600 hover:bg-red-50"
                                        >
                                            {deletingIds.has(item.id) ? (
                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 w-3.5" />
                                            )}
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 0}
                        className="h-8 text-xs border-gray-300 hover:bg-gray-50"
                    >
                        Previous
                    </Button>
                    <span className="text-xs text-gray-600 px-3">
                        Page {page + 1} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages - 1}
                        className="h-8 text-xs border-gray-300 hover:bg-gray-50"
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    );
}
