'use client';

import { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';
import wisdomVerses from '@/lib/data/wisdom_verses.json';
import { cn } from '@/lib/utils';

// Deterministic random seeder based on date
function getQuoteOfTheDay() {
    const today = new Date();
    // Reset time to ensure consistency throughout the day
    const seed = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
    const dayIndex = Math.floor(seed / (1000 * 60 * 60 * 24));

    // Use the day index to select a verse
    const index = dayIndex % wisdomVerses.length;
    return wisdomVerses[index];
}

export function DailyWisdom() {
    // Hydration safe state
    const [verse, setVerse] = useState<typeof wisdomVerses[0] | null>(null);

    useEffect(() => {
        setVerse(getQuoteOfTheDay());
    }, []);

    if (!verse) return null;

    return (
        <div className="w-full max-w-xl mx-auto mt-4 mb-8 px-4 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-300">
            <div className="relative group">
                {/* Subtle Back Glow (Lighter) */}
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-200/20 via-orange-100/20 to-amber-200/20 rounded-xl blur-xl opacity-0 group-hover:opacity-50 transition duration-1000"></div>

                {/* Card Content - Lighter Theme */}
                <div className="relative rounded-xl border border-amber-900/5 bg-gradient-to-br from-white/40 to-amber-50/30 backdrop-blur-sm px-6 py-5 md:px-8 md:py-6 text-center shadow-sm hover:shadow-md transition-shadow duration-500">

                    <div className="flex flex-col items-center gap-3">
                        {/* Header Badge - Subtle */}
                        <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-amber-100/50 border border-amber-900/5">
                            <Quote size={10} className="text-amber-700/60 fill-current" />
                            <span className="text-[9px] font-bold uppercase tracking-widest text-amber-800/60">
                                Wisdom of the Day
                            </span>
                        </div>

                        {/* Verse - Dark text for light background */}
                        <div className="space-y-2">
                            <p className="text-lg md:text-xl font-serif text-stone-800 leading-snug font-medium whitespace-pre-line drop-shadow-sm">
                                {verse.sanskrit}
                            </p>

                            <p className="text-sm text-stone-500 font-light italic leading-normal max-w-md mx-auto">
                                &ldquo;{verse.translation}&rdquo;
                            </p>
                        </div>

                        {/* Footer - Minimalist */}
                        <div className="flex items-center justify-center gap-2 text-[10px] text-stone-400 font-medium pt-2 w-full max-w-xs transition-colors group-hover:text-stone-500">
                            <span className="text-amber-700/50 uppercase tracking-wider">
                                {verse.theme}
                            </span>
                            <span className="text-stone-300">•</span>
                            <span className="font-serif italic text-stone-400">
                                {verse.source}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
