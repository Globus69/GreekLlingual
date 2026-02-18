'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ContentFilters } from '@/components/admin/content-filters';
import { ContentTable } from '@/components/admin/content-table';
import { ContentModal } from '@/components/admin/ContentModal';
import { ImportExportSection } from '@/components/admin/import-export-section';
import type {
    Content,
    MultilingualContent,
    ContentFilters as Filters,
    ContentFormData,
    MultilingualContentFormData,
    BulkImportResult
} from '@/types/content';
import {
    fetchContent,
    createContent,
    updateContent,
    deleteContent,
    bulkDeleteContent,
    bulkImport,
} from '@/lib/supabase/content';
import { toast } from 'sonner';
import { Plus, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ContentV2Page() {
    const { user, isAdmin } = useAuth();
    const router = useRouter();

    const [items, setItems] = useState<MultilingualContent[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [filters, setFilters] = useState<Filters>({
        search: '',
        type: 'all',
        level: 'all',
        difficulty: 'all',
    });
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<MultilingualContent | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Check admin access
    useEffect(() => {
        if (!user || !isAdmin) {
            router.push('/login');
        }
    }, [user, isAdmin, router]);

    // Load content
    useEffect(() => {
        loadContent();
    }, [filters, currentPage]);

    const loadContent = async () => {
        setLoading(true);
        try {
            const { data, count } = await fetchContent({
                search: filters.search,
                type: filters.type !== 'all' ? filters.type : undefined,
                level: filters.level !== 'all' ? [filters.level] : undefined,
                difficulty: filters.difficulty !== 'all' ? [filters.difficulty] : undefined,
                page: currentPage - 1,
                pageSize: 50,
            });

            setItems(data);
            setTotalCount(count);
        } catch (error) {
            console.error('Error loading content:', error);
            toast.error('Failed to load content');
        } finally {
            setLoading(false);
        }
    };

    const handleFiltersChange = (newFilters: Filters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    const handleResetFilters = () => {
        setFilters({
            search: '',
            type: 'all',
            level: 'all',
            difficulty: 'all',
        });
        setCurrentPage(1);
    };

    const handleCreate = () => {
        setEditingItem(null);
        setIsCreating(true);
        setIsModalOpen(true);
    };

    const handleEdit = (item: MultilingualContent) => {
        setEditingItem(item);
        setIsCreating(false);
        setIsModalOpen(true);
    };

    const handleSave = async (formData?: MultilingualContentFormData) => {
        if (!formData) return;

        try {
            if (isCreating) {
                const data = await createContent(formData);
                if (!data) throw new Error('Failed to create content');
                toast.success('Item created successfully!');
            } else if (editingItem) {
                const data = await updateContent(editingItem.id, formData);
                if (!data) throw new Error('Failed to update content');
                toast.success('Item updated successfully!');
            }
            await loadContent();
            setIsModalOpen(false);
        } catch (error) {
            console.error('Error saving content:', error);
            toast.error('Failed to save item');
            throw error;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            const success = await deleteContent(id);
            if (!success) throw new Error('Failed to delete content');
            toast.success('Item deleted successfully!');
            await loadContent();
        } catch (error) {
            console.error('Error deleting content:', error);
            toast.error('Failed to delete item');
        }
    };

    const handleBulkDelete = async (ids: string[]) => {
        try {
            const success = await bulkDeleteContent(ids);
            if (!success) throw new Error('Failed to bulk delete content');
            toast.success(`${ids.length} items deleted successfully!`);
            setSelectedIds([]);
            await loadContent();
        } catch (error) {
            console.error('Error bulk deleting content:', error);
            toast.error('Failed to delete items');
        }
    };

    const handleImport = async (importItems: any[]): Promise<BulkImportResult> => {
        const result = await bulkImport(importItems);
        const imported = result.success;
        const failed = result.errors.length;

        if (imported > 0) {
            toast.success(`Successfully imported ${imported} items!`);
            await loadContent();
        }
        if (failed > 0) {
            toast.error(`Failed to import ${failed} items`);
        }

        return {
            success: imported > 0,
            imported,
            failed,
            errors: result.errors.map((msg, idx) => ({ row: idx, error: msg }))
        };
    };

    const totalPages = Math.ceil(totalCount / 50);

    if (!user || !isAdmin) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
            </div>

            {/* Header */}
            <div className="relative glass border-b border-white/10">
                <div className="max-w-7xl mx-auto px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-6">
                            <Link href="/admin">
                                <Button variant="ghost" size="icon" className="hover:bg-white/10">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-3">
                                    <span className="text-4xl">📦</span>
                                    Content Management
                                </h1>
                                <p className="text-sm text-white/70 mt-1 font-medium">
                                    Manage vocabulary, phrases, and grammar
                                </p>
                            </div>
                        </div>

                        {/* New Item Button */}
                        <Button
                            onClick={handleCreate}
                            size="lg"
                            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20"
                        >
                            <Plus className="h-5 w-5" />
                            New Item
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative max-w-7xl mx-auto px-8 py-10 space-y-8">
                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Items', value: totalCount, gradient: 'from-blue-500 to-blue-600' },
                        { label: 'Current Page', value: currentPage, gradient: 'from-purple-500 to-purple-600' },
                        { label: 'Total Pages', value: totalPages, gradient: 'from-pink-500 to-pink-600' },
                        { label: 'Selected', value: selectedIds.length, gradient: 'from-green-500 to-green-600' },
                    ].map((stat, idx) => (
                        <div
                            key={idx}
                            className="glass-card p-6 hover:bg-white/5 transition-colors"
                        >
                            <div className={`text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br ${stat.gradient}`}>
                                {stat.value}
                            </div>
                            <div className="text-xs text-white/70 font-medium mt-1 tracking-wide uppercase">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Filters */}
                <ContentFilters
                    filters={filters}
                    onFiltersChange={handleFiltersChange}
                    onReset={handleResetFilters}
                />

                {/* Import/Export Section */}
                <ImportExportSection onImport={handleImport} filters={filters} />

                {/* Table */}
                <ContentTable
                    items={items}
                    loading={loading}
                    selectedIds={selectedIds}
                    onSelectionChange={setSelectedIds}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onBulkDelete={handleBulkDelete}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span className="text-sm text-white/70 px-4">
                            Page {currentPage} of {totalPages}
                        </span>
                        <Button
                            variant="outline"
                            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </div>
                )}
            </div>

            {/* Modal */}
            <ContentModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSave}
                item={editingItem}
                isCreating={isCreating}
            />
        </div>
    );
}
