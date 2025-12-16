
'use client';

import { useState, useEffect } from 'react';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuestionInputProps {
    onSubmit: (question: string) => void;
    isLoading: boolean;
    initialValue?: string;
}

export function QuestionInput({ onSubmit, isLoading, initialValue = '' }: QuestionInputProps) {
    const [value, setValue] = useState(initialValue);

    // Update local state if initialValue changes (e.g. from clicking an example)
    useEffect(() => {
        if (initialValue) setValue(initialValue);
    }, [initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim() && !isLoading) {
            onSubmit(value.trim());
            setValue(''); // Auto-clear after submit
        }
    };

    return (
        <div className="w-full max-w-xl relative group z-10 mx-auto">
            <div className={cn(
                "absolute inset-0 bg-gradient-to-r from-amber-200 to-orange-100 rounded-2xl blur opacity-20 transition-opacity duration-500",
                isLoading ? "opacity-50 animate-pulse" : "group-hover:opacity-30"
            )}></div>

            <form onSubmit={handleSubmit} className="relative bg-white rounded-2xl shadow-medium input-ring border border-stone-200/60 transition-all duration-300 focus-within:ring-2 focus-within:ring-amber-200/50">
                <div className="flex items-center px-4 py-4">
                    <Sparkles className={cn("h-5 w-5 text-amber-500/80 mr-3 transition-all", isLoading && "animate-spin text-amber-600")} />
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        disabled={isLoading}
                        className="w-full bg-transparent border-none focus:ring-0 text-lg font-serif placeholder:text-stone-300 text-stone-900 placeholder:italic outline-none disabled:opacity-50"
                        placeholder="Ask a question about Dharma..."
                    />
                    <button
                        type="submit"
                        disabled={!value.trim() || isLoading}
                        className="p-2 rounded-xl bg-stone-900 text-white hover:bg-stone-800 disabled:bg-stone-200 disabled:cursor-not-allowed transition-colors shadow-lg shadow-stone-900/20"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
