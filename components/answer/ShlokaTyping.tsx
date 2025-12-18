'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

const SHLOKAS = [
    "तपः स्वाध्याय निरताम् नारदं परिपप्रच्छ",
    "रामो विग्रहवान् धर्मः साधुः सत्य पराक्रमः",
    "धर्मज्ञश्च कृतज्ञश्च सत्य वाक्यो दृढ व्रतः",
    "यत्र यत्र रघुनाथ कीर्तनम् तत्र तत्र कृत मस्तकाञ्जलिम्"
];

export function ShlokaTyping() {
    const [currentShlokaIndex, setCurrentShlokaIndex] = useState(0);
    const [displayedText, setDisplayedText] = useState("");
    const [started, setStarted] = useState(false);

    useEffect(() => {
        const shloka = SHLOKAS[currentShlokaIndex];
        // Safe split
        const segmenter = new Intl.Segmenter('sa', { granularity: 'grapheme' });
        const chars = Array.from(segmenter.segment(shloka)).map(s => s.segment);

        let charIndex = 0;
        let timeoutId: NodeJS.Timeout;

        const typeChar = () => {
            if (charIndex < chars.length) {
                const charToAdd = chars[charIndex];
                if (charToAdd) {
                    setDisplayedText(prev => prev + charToAdd);
                }
                charIndex++;
                // Randomize typing speed slightly for realism (30-70ms)
                const delay = 30 + Math.random() * 40;
                timeoutId = setTimeout(typeChar, delay);
            } else {
                // Done typing, hold then evaporate
                timeoutId = setTimeout(() => {
                    // Fade out logic is handled by parent or simply switching
                    // simpler: Switch directly after pause for now, or add fade state
                    setStarted(false); // Trigger fade out if we added a class based on this

                    setTimeout(() => {
                        setDisplayedText("");
                        setCurrentShlokaIndex((prev) => (prev + 1) % SHLOKAS.length);
                        setStarted(true); // Ready for next
                    }, 500); // Wait for fade out
                }, 2000); // Hold for 2s
            }
        };

        // Start typing loop
        setStarted(true);
        timeoutId = setTimeout(typeChar, 500); // Initial delay

        return () => clearTimeout(timeoutId);
    }, [currentShlokaIndex]);

    return (
        <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-10 p-8">
            <div className="text-center max-w-2xl min-h-[3rem]">
                <span className={cn(
                    "font-serif text-2xl md:text-3xl text-stone-600 transition-opacity duration-500",
                    started ? "opacity-100" : "opacity-0"
                )}>
                    {displayedText}
                </span>
                <span className="inline-block w-[3px] h-[1.2em] bg-amber-500 ml-1 animate-pulse align-middle" />
            </div>
        </div>
    );
}
