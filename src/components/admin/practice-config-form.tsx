/**
 * Practice Config Form Component
 *
 * Admin form to configure practice modes for learning items
 * - Integrates with React Hook Form + Zod validation
 * - Uses shadcn/ui components
 * - Backend-configurable practice mode settings
 */

'use client';

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Loader2, ChevronDown, ChevronRight } from 'lucide-react';
import { useToast } from '@/components/ui/toast';
import {
    practiceModesConfigSchema,
    type PracticeModesConfig,
    PRACTICE_MODES,
} from '@/lib/validation/schemas';
import { useState } from 'react';

interface PracticeConfigFormProps {
    itemId: string;
    initialConfig: PracticeModesConfig | null;
    onSave: (config: PracticeModesConfig) => Promise<void>;
    onCancel: () => void;
}

export function PracticeConfigForm({
    itemId,
    initialConfig,
    onSave,
    onCancel,
}: PracticeConfigFormProps) {
    const { success, error: showError } = useToast();
    const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
        matching: false,
        multiple_choice: false,
        write_input: false,
    });

    const {
        register,
        control,
        handleSubmit,
        formState: { errors, isSubmitting },
        reset,
        watch,
        setValue,
    } = useForm<PracticeModesConfig>({
        resolver: zodResolver(practiceModesConfigSchema),
        defaultValues: initialConfig || {
            enabled: false,
            available_modes: [],
            activation_threshold: 3,
            difficulty_settings: {
                matching: {
                    num_pairs: 6,
                    time_limit_sec: null,
                },
                multiple_choice: {
                    num_options: 4,
                    time_limit_sec: 30,
                    show_hint: true,
                },
                write_input: {
                    tolerance: 'lenient',
                    show_phonetic: true,
                    max_attempts: 3,
                },
            },
        },
    });

    const enabled = watch('enabled');
    const availableModes = watch('available_modes');

    useEffect(() => {
        if (initialConfig) {
            reset(initialConfig);
        }
    }, [initialConfig, reset]);

    const onSubmit = async (data: PracticeModesConfig) => {
        try {
            await onSave(data);
            success('Practice configuration saved!');
        } catch (err) {
            console.error('[PracticeConfigForm] Save error:', err);
            showError('Failed to save configuration');
        }
    };

    const toggleSection = (section: string) => {
        setExpandedSections((prev) => ({
            ...prev,
            [section]: !prev[section],
        }));
    };

    const toggleMode = (mode: string, checked: boolean) => {
        const currentModes = availableModes || [];
        if (checked) {
            setValue('available_modes', [...currentModes, mode] as any);
        } else {
            setValue(
                'available_modes',
                currentModes.filter((m) => m !== mode) as any
            );
        }
    };

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Master Enable Toggle */}
            <div className="flex items-center space-x-2">
                <Controller
                    name="enabled"
                    control={control}
                    render={({ field }) => (
                        <Checkbox
                            id="practice-enabled"
                            checked={field.value}
                            onCheckedChange={field.onChange}
                        />
                    )}
                />
                <Label
                    htmlFor="practice-enabled"
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                    Enable Practice Modes
                </Label>
            </div>

            {enabled && (
                <>
                    {/* Activation Threshold */}
                    <div className="space-y-2">
                        <Label htmlFor="activation-threshold">
                            Activation Threshold (FSRS Reviews)
                        </Label>
                        <Input
                            id="activation-threshold"
                            type="number"
                            min={0}
                            max={50}
                            {...register('activation_threshold', { valueAsNumber: true })}
                            className="w-full"
                        />
                        {errors.activation_threshold && (
                            <p className="text-sm text-red-500">
                                {errors.activation_threshold.message}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            Number of FSRS reviews before practice modes unlock
                        </p>
                    </div>

                    {/* Available Modes */}
                    <div className="space-y-3">
                        <Label>Available Practice Modes</Label>
                        <div className="space-y-2">
                            {PRACTICE_MODES.map((mode) => (
                                <div key={mode} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`mode-${mode}`}
                                        checked={availableModes?.includes(mode)}
                                        onCheckedChange={(checked) =>
                                            toggleMode(mode, checked as boolean)
                                        }
                                    />
                                    <Label
                                        htmlFor={`mode-${mode}`}
                                        className="text-sm font-normal cursor-pointer"
                                    >
                                        {mode === 'matching' && '🎮 Matching Game'}
                                        {mode === 'multiple_choice' && '🎯 Multiple Choice'}
                                        {mode === 'write_input' && '✍️ Write It Out'}
                                    </Label>
                                </div>
                            ))}
                        </div>
                        {errors.available_modes && (
                            <p className="text-sm text-red-500">
                                {errors.available_modes.message}
                            </p>
                        )}
                    </div>

                    {/* Difficulty Settings */}
                    <div className="space-y-4 pt-4 border-t border-border/30">
                        <h3 className="text-sm font-medium text-muted-foreground">
                            Difficulty Settings
                        </h3>

                        {/* Matching Game Settings */}
                        {availableModes?.includes('matching') && (
                            <details
                                className="group border border-border/30 rounded-lg"
                                open={expandedSections.matching}
                            >
                                <summary
                                    className="cursor-pointer px-4 py-3 flex items-center gap-2 hover:bg-accent/50 rounded-lg transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleSection('matching');
                                    }}
                                >
                                    {expandedSections.matching ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                    <span className="font-medium text-sm">
                                        Matching Game Settings
                                    </span>
                                </summary>
                                {expandedSections.matching && (
                                    <div className="px-4 pb-4 space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="matching-pairs">
                                                Number of Pairs
                                            </Label>
                                            <Input
                                                id="matching-pairs"
                                                type="number"
                                                min={3}
                                                max={10}
                                                {...register(
                                                    'difficulty_settings.matching.num_pairs',
                                                    { valueAsNumber: true }
                                                )}
                                            />
                                            {errors.difficulty_settings?.matching?.num_pairs && (
                                                <p className="text-sm text-red-500">
                                                    {
                                                        errors.difficulty_settings.matching.num_pairs
                                                            .message
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="matching-time">
                                                Time Limit (seconds, optional)
                                            </Label>
                                            <Input
                                                id="matching-time"
                                                type="number"
                                                min={10}
                                                placeholder="No limit"
                                                {...register(
                                                    'difficulty_settings.matching.time_limit_sec',
                                                    {
                                                        setValueAs: (v) =>
                                                            v === '' ? null : parseInt(v),
                                                    }
                                                )}
                                            />
                                            {errors.difficulty_settings?.matching
                                                ?.time_limit_sec && (
                                                <p className="text-sm text-red-500">
                                                    {
                                                        errors.difficulty_settings.matching
                                                            .time_limit_sec.message
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </details>
                        )}

                        {/* Multiple Choice Settings */}
                        {availableModes?.includes('multiple_choice') && (
                            <details
                                className="group border border-border/30 rounded-lg"
                                open={expandedSections.multiple_choice}
                            >
                                <summary
                                    className="cursor-pointer px-4 py-3 flex items-center gap-2 hover:bg-accent/50 rounded-lg transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleSection('multiple_choice');
                                    }}
                                >
                                    {expandedSections.multiple_choice ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                    <span className="font-medium text-sm">
                                        Multiple Choice Settings
                                    </span>
                                </summary>
                                {expandedSections.multiple_choice && (
                                    <div className="px-4 pb-4 space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="mc-options">Number of Options</Label>
                                            <Input
                                                id="mc-options"
                                                type="number"
                                                min={2}
                                                max={6}
                                                {...register(
                                                    'difficulty_settings.multiple_choice.num_options',
                                                    { valueAsNumber: true }
                                                )}
                                            />
                                            {errors.difficulty_settings?.multiple_choice
                                                ?.num_options && (
                                                <p className="text-sm text-red-500">
                                                    {
                                                        errors.difficulty_settings.multiple_choice
                                                            .num_options.message
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="mc-time">Time Limit (seconds)</Label>
                                            <Input
                                                id="mc-time"
                                                type="number"
                                                min={10}
                                                max={300}
                                                {...register(
                                                    'difficulty_settings.multiple_choice.time_limit_sec',
                                                    { valueAsNumber: true }
                                                )}
                                            />
                                            {errors.difficulty_settings?.multiple_choice
                                                ?.time_limit_sec && (
                                                <p className="text-sm text-red-500">
                                                    {
                                                        errors.difficulty_settings.multiple_choice
                                                            .time_limit_sec.message
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Controller
                                                name="difficulty_settings.multiple_choice.show_hint"
                                                control={control}
                                                render={({ field }) => (
                                                    <Checkbox
                                                        id="mc-hint"
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                )}
                                            />
                                            <Label htmlFor="mc-hint" className="text-sm font-normal">
                                                Show phonetic hint
                                            </Label>
                                        </div>
                                    </div>
                                )}
                            </details>
                        )}

                        {/* Write Input Settings */}
                        {availableModes?.includes('write_input') && (
                            <details
                                className="group border border-border/30 rounded-lg"
                                open={expandedSections.write_input}
                            >
                                <summary
                                    className="cursor-pointer px-4 py-3 flex items-center gap-2 hover:bg-accent/50 rounded-lg transition-colors"
                                    onClick={(e) => {
                                        e.preventDefault();
                                        toggleSection('write_input');
                                    }}
                                >
                                    {expandedSections.write_input ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                    <span className="font-medium text-sm">
                                        Write Input Settings
                                    </span>
                                </summary>
                                {expandedSections.write_input && (
                                    <div className="px-4 pb-4 space-y-3">
                                        <div className="space-y-2">
                                            <Label htmlFor="write-tolerance">
                                                Matching Tolerance
                                            </Label>
                                            <Controller
                                                name="difficulty_settings.write_input.tolerance"
                                                control={control}
                                                render={({ field }) => (
                                                    <Select
                                                        value={field.value}
                                                        onValueChange={field.onChange}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="strict">
                                                                Strict (exact match)
                                                            </SelectItem>
                                                            <SelectItem value="lenient">
                                                                Lenient (allows typos)
                                                            </SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            />
                                            {errors.difficulty_settings?.write_input?.tolerance && (
                                                <p className="text-sm text-red-500">
                                                    {
                                                        errors.difficulty_settings.write_input
                                                            .tolerance.message
                                                    }
                                                </p>
                                            )}
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Controller
                                                name="difficulty_settings.write_input.show_phonetic"
                                                control={control}
                                                render={({ field }) => (
                                                    <Checkbox
                                                        id="write-phonetic"
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                )}
                                            />
                                            <Label
                                                htmlFor="write-phonetic"
                                                className="text-sm font-normal"
                                            >
                                                Show phonetic hint
                                            </Label>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="write-attempts">Max Attempts</Label>
                                            <Input
                                                id="write-attempts"
                                                type="number"
                                                min={1}
                                                max={5}
                                                {...register(
                                                    'difficulty_settings.write_input.max_attempts',
                                                    { valueAsNumber: true }
                                                )}
                                            />
                                            {errors.difficulty_settings?.write_input
                                                ?.max_attempts && (
                                                <p className="text-sm text-red-500">
                                                    {
                                                        errors.difficulty_settings.write_input
                                                            .max_attempts.message
                                                    }
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </details>
                        )}
                    </div>
                </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end pt-4 border-t border-border/30">
                <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                    Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                        <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        'Save Configuration'
                    )}
                </Button>
            </div>
        </form>
    );
}
