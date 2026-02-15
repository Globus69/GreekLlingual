// components/admin/ContentModal.tsx – zentrierter Glass-Modal für New/Edit

'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Dialog,
    DialogContent,
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
    type: z.enum(['vocabulary', 'phrase', 'grammar'], {
        required_error: 'Type is required',
    }),
    level: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], {
        required_error: 'Level is required',
    }),
    difficulty: z.enum(['easy', 'medium', 'hard'], {
        required_error: 'Difficulty is required',
    }),
    english: z.string().min(1, 'English text is required'),
    greek: z.string().min(1, 'Greek text is required'),
    phonetic: z.string().trim().optional().or(z.literal('')),
    audio_url: z
        .string()
        .trim()
        .url('Must be a valid URL')
        .optional()
        .or(z.literal('')),
    example_en: z.string().trim().optional().or(z.literal('')),
    example_gr: z.string().trim().optional().or(z.literal('')),
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
            level: 'A1',
            difficulty: 'easy',
            english: '',
            greek: '',
            phonetic: '',
            audio_url: '',
            example_en: '',
            example_gr: '',
        },
    });

    const selectedType = watch('type');
    const selectedLevel = watch('level');
    const selectedDifficulty = watch('difficulty');

    useEffect(() => {
        if (item && !isCreating) {
            reset({
                type: item.type,
                level: item.level,
                difficulty: item.difficulty,
                english: item.english,
                greek: item.greek,
                phonetic: item.phonetic || '',
                audio_url: item.audio_url || '',
                example_en: item.example_en || '',
                example_gr: item.example_gr || '',
            });
        } else {
            reset({
                type: 'vocabulary',
                level: 'A1',
                difficulty: 'easy',
                english: '',
                greek: '',
                phonetic: '',
                audio_url: '',
                example_en: '',
                example_gr: '',
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
            <DialogContent className="sm:max-w-[620px] backdrop-blur-xl bg-background/40 dark:bg-black/40 border border-border/50 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-xl font-semibold">
                        {isCreating ? 'Create New Content' : 'Edit Content'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    {/* Type */}
                    <div className="space-y-2">
                        <Label htmlFor="type" className="text-sm font-medium">
                            Type <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={selectedType}
                            onValueChange={(value) => setValue('type', value as any)}
                        >
                            <SelectTrigger id="type">
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

                    {/* Level */}
                    <div className="space-y-2">
                        <Label htmlFor="level" className="text-sm font-medium">
                            Level <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={selectedLevel}
                            onValueChange={(value) => setValue('level', value as any)}
                        >
                            <SelectTrigger id="level">
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
                        <Label htmlFor="difficulty" className="text-sm font-medium">
                            Difficulty <span className="text-red-500">*</span>
                        </Label>
                        <Select
                            value={selectedDifficulty}
                            onValueChange={(value) => setValue('difficulty', value as any)}
                        >
                            <SelectTrigger id="difficulty">
                                <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="easy">Easy</SelectItem>
                                <SelectItem value="medium">Medium</SelectItem>
                                <SelectItem value="hard">Hard</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.difficulty && (
                            <p className="text-sm text-red-500">{errors.difficulty.message}</p>
                        )}
                    </div>

                    {/* English */}
                    <div className="space-y-2">
                        <Label htmlFor="english" className="text-sm font-medium">
                            English <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="english"
                            {...register('english')}
                            placeholder="Enter English text"
                            className="min-h-[90px] resize-none"
                        />
                        {errors.english && (
                            <p className="text-sm text-red-500">{errors.english.message}</p>
                        )}
                    </div>

                    {/* Greek */}
                    <div className="space-y-2">
                        <Label htmlFor="greek" className="text-sm font-medium">
                            Greek <span className="text-red-500">*</span>
                        </Label>
                        <Textarea
                            id="greek"
                            {...register('greek')}
                            placeholder="Εισάγετε ελληνικό κείμενο"
                            className="min-h-[90px] resize-none font-sans"
                        />
                        {errors.greek && (
                            <p className="text-sm text-red-500">{errors.greek.message}</p>
                        )}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/30 pt-4 space-y-5">
                        {/* Phonetic */}
                        <div className="space-y-2">
                            <Label htmlFor="phonetic" className="text-sm font-medium text-muted-foreground">
                                Phonetic
                            </Label>
                            <Input
                                id="phonetic"
                                {...register('phonetic')}
                                placeholder="e.g., YAH-soo"
                            />
                        </div>

                        {/* Audio URL */}
                        <div className="space-y-2">
                            <Label htmlFor="audio_url" className="text-sm font-medium text-muted-foreground">
                                Audio URL
                            </Label>
                            <Input
                                id="audio_url"
                                type="url"
                                {...register('audio_url')}
                                placeholder="https://example.com/audio.mp3"
                            />
                            {errors.audio_url && (
                                <p className="text-sm text-red-500">{errors.audio_url.message}</p>
                            )}
                        </div>

                        {/* Example English */}
                        <div className="space-y-2">
                            <Label htmlFor="example_en" className="text-sm font-medium text-muted-foreground">
                                Example (English)
                            </Label>
                            <Textarea
                                id="example_en"
                                {...register('example_en')}
                                placeholder="Example sentence in English"
                                className="min-h-[60px] resize-none"
                            />
                        </div>

                        {/* Example Greek */}
                        <div className="space-y-2">
                            <Label htmlFor="example_gr" className="text-sm font-medium text-muted-foreground">
                                Example (Greek)
                            </Label>
                            <Textarea
                                id="example_gr"
                                {...register('example_gr')}
                                placeholder="Παράδειγμα πρότασης στα ελληνικά"
                                className="min-h-[60px] resize-none font-sans"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="min-w-[140px] bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isCreating ? 'Save' : 'Update'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
