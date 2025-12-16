'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

// Famous verses (Using shorter snippets for better visual effect)
const SHLOKAS = [
    [
        "तपः स्वाध्याय निरताम्",
        "नारदं परिपप्रच्छ"
    ],
    [
        "रामो विग्रहवान् धर्मः",
        "साधुः सत्य पराक्रमः"
    ],
    [
        "धर्मज्ञश्च कृतज्ञश्च",
        "सत्य वाक्यो दृढ व्रतः"
    ]
];

export function ShlokaRain() {
    const [currentShlokaIndex, setCurrentShlokaIndex] = useState(0);
    const [phase, setPhase] = useState<'rain' | 'hold' | 'evaporate'>('rain');
    // We'll use a simple counter to trigger css animations
    // but React rendering is easier. 

    useEffect(() => {
        const runCycle = async () => {
            setPhase('rain');
            // Wait for rain to finish (longer for sequential)
            // Approx 30-40 chars * 50ms = 1.5s - 2s. + 700ms animation duration.
            // Let's give it 3.5s to be safe and leisurely.
            await new Promise(r => setTimeout(r, 3500));

            setPhase('hold');
            await new Promise(r => setTimeout(r, 2000));

            setPhase('evaporate');
            await new Promise(r => setTimeout(r, 800));

            setCurrentShlokaIndex(prev => (prev + 1) % SHLOKAS.length);
        };

        runCycle();
        return () => { };
    }, [currentShlokaIndex]);

    const lines = SHLOKAS[currentShlokaIndex];

    // Helper to calculate previous chars for strict sequencing
    let charCountSoFar = 0;

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-10 p-8 overflow-hidden">
            <div className="space-y-6 text-center">
                {lines.map((line, lineIdx) => {
                    // Use Intl.Segmenter to correctly split Sanskrit graphemes (preventing broken rendering)
                    const segmenter = new Intl.Segmenter('sa', { granularity: 'grapheme' });
                    const formatedChars = Array.from(segmenter.segment(line)).map(s => s.segment);

                    // Capture current start index for this line
                    const startDelayIndex = charCountSoFar;
                    // Update count for next line
                    charCountSoFar += formatedChars.length;

                    return (
                        <div key={`${currentShlokaIndex}-${lineIdx}`} className="font-serif text-2xl md:text-3xl text-stone-600 flex justify-center flex-wrap px-4">
                            {formatedChars.map((char, charIdx) => {
                                // Strict sequential delay: (GlobalIndex * Speed)
                                const sequentialDelay = (startDelayIndex + charIdx) * 60;

                                return (
                                    <span
                                        key={charIdx}
                                        style={{
                                            animationDelay: `${sequentialDelay}ms`,
                                            marginRight: char === ' ' ? '0.5rem' : '1px',
                                            animationFillMode: 'both' // Ensures valid start (hidden) and end (visible) states
                                        }}
                                        className={cn(
                                            "inline-block transition-all duration-700 min-w-[1px]",
                                            // Rain Phase: Animate in from top. REMOVE opacity-0 base class so it animates TO visible.
                                            // 'both' fill mode handles the initial invisibility during delay.
                                            phase === 'rain' && "animate-in fade-in slide-in-from-top-12 duration-500",
                                            // Evaporate: Fade out moving up
                                            phase === 'evaporate' && "opacity-0 -translate-y-8 transition-all duration-700 ease-in",
                                            // Hold: Visible
                                            phase === 'hold' && "opacity-100 translate-y-0"
                                        )}
                                    >
                                        {char === ' ' ? '\u00A0' : char}
                                    </span>
                                );
                            })}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
