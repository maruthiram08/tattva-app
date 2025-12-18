'use client';

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ArrowRight, Loader2, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

// Types for Web Speech API
interface IWindow extends Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
}

interface FloatingQuestionInputProps {
    onSubmit: (question: string) => void;
    isLoading: boolean;
}

export function FloatingQuestionInput({ onSubmit, isLoading }: FloatingQuestionInputProps) {
    const [value, setValue] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);
    const [isListening, setIsListening] = useState(false);
    const recognitionRef = useRef<any>(null);

    // Initialize Speech Recognition
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const { webkitSpeechRecognition, SpeechRecognition } = window as unknown as IWindow;
            const SpeechRecognitionConstructor = SpeechRecognition || webkitSpeechRecognition;

            if (SpeechRecognitionConstructor) {
                const recognition = new SpeechRecognitionConstructor();
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = 'en-US';

                recognition.onstart = () => setIsListening(true);
                recognition.onend = () => setIsListening(false);
                recognition.onresult = (event: any) => {
                    const transcript = event.results[0][0].transcript;
                    setValue(prev => {
                        const newValue = prev ? `${prev} ${transcript} ` : transcript;
                        return newValue;
                    });
                    // Optional: Auto-submit on silence/end? For now, let user edit then submit.
                };
                recognition.onerror = (event: any) => {
                    console.error('Speech recognition error', event.error);
                    setIsListening(false);
                };

                recognitionRef.current = recognition;
            }
        }
    }, []);

    const toggleListening = () => {
        if (!recognitionRef.current) {
            alert('Voice search is not supported in this browser.');
            return;
        }

        if (isListening) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (value.trim() && !isLoading) {
            onSubmit(value.trim());
            setValue(''); // Auto-clear
            inputRef.current?.blur();
        }
    };

    const [isFocused, setIsFocused] = useState(false);
    const hasValue = value.trim().length > 0;
    const isExpanded = isFocused || hasValue || isLoading || isListening;

    return (
        <div className={cn(
            "fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-50 w-full px-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200 transition-all duration-500 ease-out",
            isExpanded ? "max-w-md" : "max-w-[220px] md:max-w-[260px]"
        )}>
            <form
                onSubmit={handleSubmit}
                onClick={() => inputRef.current?.focus()}
                className={cn(
                    "relative flex items-center gap-2 pl-4 pr-2 py-2 rounded-full shadow-2xl transition-all duration-500 ease-out border border-stone-700/50 cursor-text",
                    "bg-stone-900/95 backdrop-blur-md text-stone-50",
                    "hover:shadow-stone-900/20 hover:border-stone-600",
                    isExpanded ? "ring-1 ring-stone-500/50 border-stone-500" : ""
                )}
            >
                <div className="flex-shrink-0 relative flex items-center justify-center w-8 h-8 md:w-10 md:h-10">
                    {isLoading ? (
                        <div className="relative w-full h-full animate-spin">
                            <Image
                                src="/favicon_light.png"
                                alt="Loading"
                                fill
                                className="object-contain"
                            />
                        </div>
                    ) : (
                        <div className="relative w-full h-full">
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
                    <span className="flex-grow text-base md:text-lg font-serif text-amber-100/80 italic animate-pulse tracking-wide whitespace-nowrap overflow-hidden text-ellipsis drop-shadow-md px-2">
                        Consulting Valmiki&apos;s Wisdom...
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
                        placeholder={isListening ? "Listening..." : (isExpanded ? "Ask Tattva..." : "Ask...")}
                    />
                )}

                {/* Mobile: Show text when collapsed if needed, or just icon? 
                    Design decision: When collapsed, it looks like a pill with Icon + "Ask..." 
                */}
                {!isExpanded && !isLoading && (
                    <span className="absolute left-16 top-1/2 -translate-y-1/2 text-stone-400/70 font-serif italic pointer-events-none whitespace-nowrap md:hidden">
                        Ask Tattva...
                    </span>
                )}

                <div className="flex items-center gap-1">
                    {/* Voice Search Button */}
                    {!isLoading && (
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                toggleListening();
                            }}
                            className={cn(
                                "p-2 rounded-full transition-all duration-300 hover:bg-stone-800",
                                isListening ? "text-red-400 animate-pulse bg-red-950/30" : "text-stone-400 hover:text-stone-200"
                            )}
                            title="Voice Search"
                        >
                            {isListening ? <MicOff size={20} /> : <Mic size={20} />}
                        </button>
                    )}

                    <button
                        type="submit"
                        disabled={!value.trim() || isLoading}
                        className={cn(
                            "p-2 rounded-full transition-all duration-300 flex items-center justify-center",
                            value.trim() && !isLoading
                                ? "bg-amber-600 text-white hover:bg-amber-500 shadow-lg shadow-amber-900/20"
                                : "bg-stone-800 text-stone-500 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    </button>
                </div>
            </form>
        </div>
    );
}
