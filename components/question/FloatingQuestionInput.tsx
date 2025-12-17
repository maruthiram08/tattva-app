'use client';

import { useState, useRef } from 'react';
import Image from 'next/image';
import { ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloatingQuestionInputProps {
    onSubmit: (question: string) => void;
    isLoading: boolean;
}

export function FloatingQuestionInput({ onSubmit, isLoading }: FloatingQuestionInputProps) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim() && !isLoading) {
            onSubmit(value.trim());
            setValue(''); // Auto-clear
            inputRef.current?.blur(); // Optional: blur after submit to show full view? Or keep focus? Let's keep focus for now or just clear.
        }
    };

    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value.trim().length > 0;
    const isExpanded = isFocused || hasValue || isLoading;

    return (
        <div className={cn(
            "fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-full px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 transition-all duration-500 ease-out",
            isExpanded ? "max-w-xl" : "max-w-[220px] md:max-w-[260px]"
        )}>
            <form
                onSubmit={handleSubmit}
                onClick={() => inputRef.current?.focus()}
                className={cn(
                    "relative flex items-center gap-3 pl-5 pr-2 py-2 rounded-full shadow-2xl transition-all duration-500 ease-out border border-stone-700/50 cursor-text",
                    "bg-stone-900/95 backdrop-blur-md text-stone-50",
                    "hover:shadow-stone-900/20 hover:border-stone-600",
                    isExpanded ? "ring-1 ring-stone-500/50 border-stone-500" : ""
                )}
            >
                <div className="flex-shrink-0 relative flex items-center justify-center w-10 h-10">
                    {isLoading ? (
                        <div className="relative w-10 h-10 animate-spin">
                            <Image
                                src="/favicon_light.png"
                                alt="Loading"
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="relative w-10 h-10">
                            <Image
                                src="/favicon_light.png"
                                alt="Tattva"
                                fill
                                className="object-contain opacity-90"
                            />
                        </div>
                    )}
                </div>

                {isLoading ? (
                    <span className="flex-grow text-base md:text-lg font-serif text-stone-300 italic animate-pulse whitespace-nowrap overflow-hidden text-ellipsis">
                        Consulting the Rishis...
                    </span>
                ) : (
                    <input
                        ref={inputRef}
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={isLoading}
                        className={cn(
                            "flex-grow bg-transparent border-none focus:ring-0 text-base md:text-lg font-serif placeholder:text-stone-400/70 text-stone-100 placeholder:italic outline-none disabled:opacity-50 min-w-0 transition-opacity duration-300",
                            isExpanded ? "opacity-100" : "opacity-0 md:opacity-100 md:w-auto w-0"
                        )}
                        placeholder={isExpanded ? "Ask Tattva..." : "Ask..."}
                    />
                )}

                {/* Mobile: Show text when collapsed if needed, or just icon? 
                    Design decision: When collapsed, it looks like a pill with Icon + "Ask..." 
                */}
                {!isExpanded && !isLoading && (
                    <span className="absolute left-20 top-1/2 -translate-y-1/2 text-stone-400/70 font-serif italic pointer-events-none whitespace-nowrap md:hidden">
                        Ask Tattva...
                    </span>
                )}


                <button
                    type="submit"
                    disabled={!value.trim() || isLoading}
                    className={cn(
                        "p-2 rounded-full bg-stone-800 text-stone-300 hover:bg-stone-700 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition-all duration-200 flex-shrink-0 border border-stone-700",
                        !isExpanded && "opacity-0 pointer-events-none w-0 p-0 border-0"
                    )}
                >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                </button>
            </form>
        </div>
    );
}
