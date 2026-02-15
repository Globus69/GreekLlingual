'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import type { Content, ContentFormData } from '@/types/content';
import { Loader2 } from 'lucide-react';

const contentSchema = z.object({
    type: z.enum(['vocabulary', 'phrase', 'grammar']),
    english: z.string().min(1, 'English text is required'),
    greek: z.string().min(1, 'Greek text is required'),
    level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    phonetic: z.string().optional(),
    example_en: z.string().optional(),
    example_gr: z.string().optional(),
    audio_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
});

interface ContentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: ContentFormData) => Promise<void>;
    item?: Content | null;
    isCreating?: boolean;
}

export function ContentModal({
    isOpen,
    onClose,
    onSave,
    item,
    isCreating = false,
}: ContentModalProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        setValue,
        watch,
    } = useForm<ContentFormData>({
        resolver: zodResolver(contentSchema),
        defaultValues: {
            type: 'vocabulary',
            english: '',
            greek: '',
            level: 'A1',
            difficulty: 'easy',
            phonetic: '',
            example_en: '',
            example_gr: '',
            audio_url: '',
        },
    });

    const selectedType = watch('type');
    const selectedLevel = watch('level');
    const selectedDifficulty = watch('difficulty');

    useEffect(() => {
        if (item && !isCreating) {
            reset({
                type: item.type,
                english: item.english,
                greek: item.greek,
                level: item.level,
                difficulty: item.difficulty,
                phonetic: item.phonetic || '',
                example_en: item.example_en || '',
                example_gr: item.example_gr || '',
                audio_url: item.audio_url || '',
            });
        } else {
            reset({
                type: 'vocabulary',
                english: '',
                greek: '',
                level: 'A1',
                difficulty: 'easy',
                phonetic: '',
                example_en: '',
                example_gr: '',
                audio_url: '',
            });
        }
    }, [item, isCreating, reset]);

    const onSubmit = async (data: ContentFormData) => {
        try {
            await onSave(data);
            reset();
            onClose();
        } catch (error) {
            console.error('Error saving content:', error);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="glass-card max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">
                        {isCreating ? '✨ Create New Item' : '✏️ Edit Item'}
                    </DialogTitle>
                    <DialogDescription>
                        {isCreating
                            ? 'Add a new learning item to your content library'
                            : 'Update the details of this learning item'}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    {/* Required Fields */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Required Fields
                        </h3>

                        {/* Type */}
                        <div className="space-y-2">
                            <Label htmlFor="type">
                                Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedType}
                                onValueChange={(value) => setValue('type', value as any)}
                            >
                                <SelectTrigger id="type" className="bg-background/60">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="vocabulary">Vocabulary</SelectItem>
                                    <SelectItem value="phrase">Phrase</SelectItem>
                                    <SelectItem value="grammar">Grammar</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.type && (
                                <p className="text-sm text-red-500">{errors.type.message}</p>
                            )}
                        </div>

                        {/* English */}
                        <div className="space-y-2">
                            <Label htmlFor="english">
                                English <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="english"
                                {...register('english')}
                                placeholder="Enter English text"
                                className="bg-background/60 min-h-[80px]"
                            />
                            {errors.english && (
                                <p className="text-sm text-red-500">{errors.english.message}</p>
                            )}
                        </div>

                        {/* Greek */}
                        <div className="space-y-2">
                            <Label htmlFor="greek">
                                Greek <span className="text-red-500">*</span>
                            </Label>
                            <Textarea
                                id="greek"
                                {...register('greek')}
                                placeholder="Enter Greek text"
                                className="bg-background/60 min-h-[80px]"
                            />
                            {errors.greek && (
                                <p className="text-sm text-red-500">{errors.greek.message}</p>
                            )}
                        </div>

                        {/* Level */}
                        <div className="space-y-2">
                            <Label htmlFor="level">
                                Level <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedLevel}
                                onValueChange={(value) => setValue('level', value as any)}
                            >
                                <SelectTrigger id="level" className="bg-background/60">
                                    <SelectValue placeholder="Select level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A1">A1</SelectItem>
                                    <SelectItem value="A2">A2</SelectItem>
                                    <SelectItem value="B1">B1</SelectItem>
                                    <SelectItem value="B2">B2</SelectItem>
                                    <SelectItem value="C1">C1</SelectItem>
                                    <SelectItem value="C2">C2</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.level && (
                                <p className="text-sm text-red-500">{errors.level.message}</p>
                            )}
                        </div>

                        {/* Difficulty */}
                        <div className="space-y-2">
                            <Label htmlFor="difficulty">
                                Difficulty <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedDifficulty}
                                onValueChange={(value) => setValue('difficulty', value as any)}
                            >
                                <SelectTrigger id="difficulty" className="bg-background/60">
                                    <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="easy">Easy</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="hard">Hard</SelectItem>
                                </SelectContent>
                            </Select>
                            {errors.difficulty && (
                                <p className="text-sm text-red-500">
                                    {errors.difficulty.message}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Optional Fields */}
                    <div className="space-y-4 pt-4 border-t border-border/50">
                        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                            Optional Fields
                        </h3>

                        {/* Phonetic */}
                        <div className="space-y-2">
                            <Label htmlFor="phonetic">Phonetic</Label>
                            <Input
                                id="phonetic"
                                {...register('phonetic')}
                                placeholder="e.g., YAH soo"
                                className="bg-background/60"
                            />
                        </div>

                        {/* Example English */}
                        <div className="space-y-2">
                            <Label htmlFor="example_en">Example (English)</Label>
                            <Textarea
                                id="example_en"
                                {...register('example_en')}
                                placeholder="Example sentence in English"
                                className="bg-background/60"
                            />
                        </div>

                        {/* Example Greek */}
                        <div className="space-y-2">
                            <Label htmlFor="example_gr">Example (Greek)</Label>
                            <Textarea
                                id="example_gr"
                                {...register('example_gr')}
                                placeholder="Example sentence in Greek"
                                className="bg-background/60"
                            />
                        </div>

                        {/* Audio URL */}
                        <div className="space-y-2">
                            <Label htmlFor="audio_url">Audio URL</Label>
                            <Input
                                id="audio_url"
                                {...register('audio_url')}
                                placeholder="https://example.com/audio.mp3"
                                className="bg-background/60"
                            />
                            {errors.audio_url && (
                                <p className="text-sm text-red-500">
                                    {errors.audio_url.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isSubmitting} className="gap-2">
                            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                            {isCreating ? 'Create Item' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
