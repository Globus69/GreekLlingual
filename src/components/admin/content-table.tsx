'use client';

import { useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { MultilingualContent } from '@/types/content';
import { Pencil, Trash2, Loader2 } from 'lucide-react';

interface ContentTableProps {
    items: MultilingualContent[];
    loading?: boolean;
    selectedIds: string[];
    onSelectionChange: (ids: string[]) => void;
    onEdit: (item: MultilingualContent) => void;
    onDelete: (id: string) => void;
    onBulkDelete: (ids: string[]) => void;
}

export function ContentTable({
    items,
    loading = false,
    selectedIds,
    onSelectionChange,
    onEdit,
    onDelete,
    onBulkDelete,
}: ContentTableProps) {
    const isAllSelected = items.length > 0 && selectedIds.length === items.length;
    const isSomeSelected = selectedIds.length > 0 && !isAllSelected;

    const handleSelectAll = () => {
        if (isAllSelected) {
            onSelectionChange([]);
        } else {
            onSelectionChange(items.map((item) => item.id));
        }
    };

    const handleSelectItem = (id: string) => {
        if (selectedIds.includes(id)) {
            onSelectionChange(selectedIds.filter((selectedId) => selectedId !== id));
        } else {
            onSelectionChange([...selectedIds, id]);
        }
    };

    const handleBulkDelete = () => {
        if (
            confirm(
                `Are you sure you want to delete ${selectedIds.length} item(s)? This action cannot be undone.`
            )
        ) {
            onBulkDelete(selectedIds);
        }
    };

    if (loading) {
        return (
            <Card className="glass-card p-12 flex items-center justify-center">
                <div className="flex items-center gap-3 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading content...</span>
                </div>
            </Card>
        );
    }

    if (items.length === 0) {
        return (
            <Card className="glass-card p-12 text-center">
                <div className="text-6xl mb-4 opacity-50">📦</div>
                <p className="text-lg font-medium text-foreground">No items found</p>
                <p className="text-sm text-muted-foreground mt-2">
                    Try adjusting your filters or create a new item
                </p>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {/* Bulk Actions Toolbar */}
            {selectedIds.length > 0 && (
                <Card className="glass-card p-4 flex items-center justify-between">
                    <span className="text-sm font-medium">
                        {selectedIds.length} item(s) selected
                    </span>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleBulkDelete}
                        className="gap-2"
                    >
                        <Trash2 className="h-4 w-4" />
                        Delete Selected
                    </Button>
                </Card>
            )}

            {/* Table */}
            <Card className="glass-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="hover:bg-transparent border-border/50">
                            <TableHead className="w-12">
                                <Checkbox
                                    checked={isAllSelected}
                                    onCheckedChange={handleSelectAll}
                                    aria-label="Select all"
                                    className={isSomeSelected ? 'opacity-50' : ''}
                                />
                            </TableHead>
                            <TableHead className="w-24">Type</TableHead>
                            <TableHead>English</TableHead>
                            <TableHead>Greek</TableHead>
                            <TableHead className="w-20">Level</TableHead>
                            <TableHead className="w-28">Difficulty</TableHead>
                            <TableHead className="w-32">Created</TableHead>
                            <TableHead className="w-32 text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {items.map((item) => (
                            <TableRow
                                key={item.id}
                                className="border-border/50 hover:bg-accent/50"
                                data-state={selectedIds.includes(item.id) ? 'selected' : ''}
                            >
                                <TableCell>
                                    <Checkbox
                                        checked={selectedIds.includes(item.id)}
                                        onCheckedChange={() => handleSelectItem(item.id)}
                                        aria-label={`Select ${item.en_translation || item.greek_transcription}`}
                                    />
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-md bg-blue-500/10 px-2 py-1 text-xs font-medium text-blue-400 ring-1 ring-inset ring-blue-500/20">
                                        {item.type}
                                    </span>
                                </TableCell>
                                <TableCell className="font-medium max-w-xs truncate">
                                    {item.en_translation || '-'}
                                </TableCell>
                                <TableCell className="max-w-xs truncate text-blue-300">
                                    {item.greek_transcription}
                                </TableCell>
                                <TableCell>
                                    <span className="inline-flex items-center rounded-md bg-green-500/10 px-2 py-1 text-xs font-medium text-green-400 ring-1 ring-inset ring-green-500/20">
                                        {item.level}
                                    </span>
                                </TableCell>
                                <TableCell>
                                    <span
                                        className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${item.difficulty === 'easy'
                                                ? 'bg-emerald-500/10 text-emerald-400 ring-emerald-500/20'
                                                : item.difficulty === 'medium'
                                                    ? 'bg-yellow-500/10 text-yellow-400 ring-yellow-500/20'
                                                    : 'bg-red-500/10 text-red-400 ring-red-500/20'
                                            }`}
                                    >
                                        {item.difficulty}
                                    </span>
                                </TableCell>
                                <TableCell className="text-muted-foreground text-xs">
                                    {new Date(item.created_at).toLocaleDateString()}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onEdit(item)}
                                            className="h-8 w-8 hover:bg-blue-500/20 hover:text-blue-400"
                                        >
                                            <Pencil className="h-4 w-4" />
                                            <span className="sr-only">Edit</span>
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => {
                                                if (
                                                    confirm(
                                                        `Delete "${item.en_translation || item.greek_transcription}"? This action cannot be undone.`
                                                    )
                                                ) {
                                                    onDelete(item.id);
                                                }
                                            }}
                                            className="h-8 w-8 hover:bg-red-500/20 hover:text-red-400"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            <span className="sr-only">Delete</span>
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    );
}
