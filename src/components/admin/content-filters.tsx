'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import type { ContentFilters as Filters } from '@/types/content';
import { X } from 'lucide-react';

interface ContentFiltersProps {
    filters: Filters;
    onFiltersChange: (filters: Filters) => void;
    onReset: () => void;
}

export function ContentFilters({
    filters,
    onFiltersChange,
    onReset,
}: ContentFiltersProps) {
    return (
        <Card className="glass-card p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {/* Search */}
                <div className="md:col-span-2">
                    <Input
                        placeholder="🔍 Search English or Greek..."
                        value={filters.search || ''}
                        onChange={(e) =>
                            onFiltersChange({ ...filters, search: e.target.value })
                        }
                        className="bg-background/60 backdrop-blur-sm"
                    />
                </div>

                {/* Type Filter */}
                <Select
                    value={filters.type || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({ ...filters, type: value as any })
                    }
                >
                    <SelectTrigger className="bg-background/60 backdrop-blur-sm">
                        <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="vocabulary">Vocabulary</SelectItem>
                        <SelectItem value="phrase">Phrase</SelectItem>
                        <SelectItem value="grammar">Grammar</SelectItem>
                    </SelectContent>
                </Select>

                {/* Level Filter */}
                <Select
                    value={filters.level || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({ ...filters, level: value as any })
                    }
                >
                    <SelectTrigger className="bg-background/60 backdrop-blur-sm">
                        <SelectValue placeholder="Level" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Levels</SelectItem>
                        <SelectItem value="A1">A1</SelectItem>
                        <SelectItem value="A2">A2</SelectItem>
                        <SelectItem value="A1">B1</SelectItem>
                        <SelectItem value="B2">B2</SelectItem>
                        <SelectItem value="C1">C1</SelectItem>
                        <SelectItem value="C2">C2</SelectItem>
                    </SelectContent>
                </Select>

                {/* Difficulty Filter */}
                <Select
                    value={filters.difficulty || 'all'}
                    onValueChange={(value) =>
                        onFiltersChange({ ...filters, difficulty: value as any })
                    }
                >
                    <SelectTrigger className="bg-background/60 backdrop-blur-sm">
                        <SelectValue placeholder="Difficulty" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Difficulties</SelectItem>
                        <SelectItem value="easy">Easy</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="hard">Hard</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Reset Button */}
            <div className="mt-4 flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={onReset}
                    className="gap-2"
                >
                    <X className="h-4 w-4" />
                    Reset Filters
                </Button>
            </div>
        </Card>
    );
}
