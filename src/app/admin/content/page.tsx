'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { ContentTable } from '@/components/admin/ContentTable';
import { ContentModal } from '@/components/admin/ContentModal';
import { ImportExportSection } from '@/components/admin/ImportExportSection';
import { Content, ContentInsert, ContentUpdate } from '@/types/content';
import {
    fetchContent,
    createContent,
    updateContent,
    deleteContent,
    generateCSV,
} from '@/lib/supabase/content';
import { toast } from 'sonner';
import { Plus, ArrowLeft, X } from 'lucide-react';
import Link from 'next/link';

export default function ContentPage() {
    const { user, isAdmin } = useAuth();
    const router = useRouter();

    const [data, setData] = useState<Content[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const pageSize = 50;

    // Filters
    const [search, setSearch] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('');
    const [levelFilter, setLevelFilter] = useState<string[]>([]);
    const [difficultyFilter, setDifficultyFilter] = useState<string[]>([]);

    // Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<Content | null>(null);

    // Selection
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    useEffect(() => {
        if (!isAdmin) {
            router.push('/login');
        }
    }, [isAdmin, router]);

    useEffect(() => {
        loadData();
    }, [search, typeFilter, levelFilter, difficultyFilter, page]);

    const loadData = async () => {
        setLoading(true);
        try {
            const result = await fetchContent({
                search,
                type: typeFilter || undefined,
                level: levelFilter.length > 0 ? levelFilter : undefined,
                difficulty: difficultyFilter.length > 0 ? difficultyFilter : undefined,
                page,
                pageSize,
            });
            setData(result.data);
            setTotalCount(result.count);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = () => {
        setEditingItem(null);
        setIsModalOpen(true);
    };

    const handleEdit = (item: Content) => {
        setEditingItem(item);
        setIsModalOpen(true);
    };

    const handleSave = async (formData: ContentInsert) => {
        try {
            if (editingItem) {
                await updateContent(editingItem.id, formData as ContentUpdate);
                toast.success('Eintrag aktualisiert');
            } else {
                await createContent(formData);
                toast.success('Eintrag erstellt');
            }
            await loadData();
        } catch (error) {
            console.error('Error saving:', error);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteContent(id);
            toast.success('Eintrag gelöscht');
            await loadData();
        } catch (error) {
            console.error('Error deleting:', error);
        }
    };

    const handleExport = async () => {
        try {
            const result = await fetchContent({
                search,
                type: typeFilter || undefined,
                level: levelFilter.length > 0 ? levelFilter : undefined,
                difficulty: difficultyFilter.length > 0 ? difficultyFilter : undefined,
            });
            const csv = generateCSV(result.data);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `content-export-${new Date().toISOString().split('T')[0]}.csv`;
            a.click();
            URL.revokeObjectURL(url);
            toast.success('Export erfolgreich');
        } catch (error) {
            console.error('Error exporting:', error);
            toast.error('Export fehlgeschlagen');
        }
    };

    const handleResetFilters = () => {
        setSearch('');
        setTypeFilter('');
        setLevelFilter([]);
        setDifficultyFilter([]);
        setPage(0);
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    if (!isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-[#f5f5f7]">
            {/* Clean Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-md hover:bg-gray-100"
                                >
                                    <ArrowLeft className="h-4 w-4 text-gray-600" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                                    📦 Content Management
                                </h1>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Vokabeln, Phrasen und Grammatik verwalten
                                </p>
                            </div>
                        </div>

                        <Button
                            onClick={handleCreate}
                            size="sm"
                            className="bg-blue-500 hover:bg-blue-600 text-white text-sm h-8 px-3 rounded-md shadow-sm"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            New Item
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-6xl mx-auto px-6 py-6">
                {/* Stats - Compact */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                    <div className="text-sm">
                        <span className="text-gray-500">Total Items</span>
                        <div className="text-lg font-semibold text-gray-900">{totalCount}</div>
                    </div>
                    <div className="text-sm">
                        <span className="text-gray-500">Current Page</span>
                        <div className="text-lg font-semibold text-gray-900">{page + 1}</div>
                    </div>
                    <div className="text-sm">
                        <span className="text-gray-500">Total Pages</span>
                        <div className="text-lg font-semibold text-gray-900">{totalPages}</div>
                    </div>
                    <div className="text-sm">
                        <span className="text-gray-500">Selected</span>
                        <div className="text-lg font-semibold text-gray-900">{selectedIds.length}</div>
                    </div>
                </div>

                {/* Filters - Clean Combobox Style */}
                <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
                    <div className="space-y-3">
                        <Input
                            placeholder="🔍 Search English or Greek..."
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setPage(0);
                            }}
                            className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />

                        <div className="flex gap-2">
                            <Select
                                value={typeFilter}
                                onValueChange={(value) => {
                                    setTypeFilter(value === 'all' ? '' : value);
                                    setPage(0);
                                }}
                            >
                                <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="vocabulary">Vocabulary</SelectItem>
                                    <SelectItem value="phrase">Phrase</SelectItem>
                                    <SelectItem value="grammar">Grammar</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={levelFilter[0] || 'all'}
                                onValueChange={(value) => {
                                    setLevelFilter(value === 'all' ? [] : [value]);
                                    setPage(0);
                                }}
                            >
                                <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                    <SelectValue placeholder="All Levels" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Levels</SelectItem>
                                    <SelectItem value="A1">A1</SelectItem>
                                    <SelectItem value="A2">A2</SelectItem>
                                    <SelectItem value="B1">B1</SelectItem>
                                    <SelectItem value="B2">B2</SelectItem>
                                    <SelectItem value="C1">C1</SelectItem>
                                    <SelectItem value="C2">C2</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select
                                value={difficultyFilter[0] || 'all'}
                                onValueChange={(value) => {
                                    setDifficultyFilter(value === 'all' ? [] : [value]);
                                    setPage(0);
                                }}
                            >
                                <SelectTrigger className="h-9 text-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                    <SelectValue placeholder="All Difficulties" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Difficulties</SelectItem>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleResetFilters}
                                className="h-9 px-3 text-sm text-gray-600 hover:bg-gray-100"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Reset Filters
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Import/Export - Simple */}
                <ImportExportSection
                    onImportSuccess={loadData}
                    onExport={handleExport}
                />

                {/* Table */}
                <ContentTable
                    data={data}
                    loading={loading}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    page={page}
                    totalPages={totalPages}
                    onPageChange={setPage}
                />
            </div>

            {/* Modal */}
            <ContentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                item={editingItem}
            />
        </div>
    );
}
