"use client";

import { useState } from "react";
import { Shloka } from "@/lib/data/ramayana";
import { ChevronDown, ChevronUp, BookOpen, Feather } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ShlokaViewProps {
    shlokas: Shloka[];
}

// Helper to parse the translation string into structured data
// Input: "word1 meaning1, word2 meaning2..."
// Output: [{ sanskrit: "word1", meaning: "meaning1" }, ...]
function parseWordByWord(translation: string | null | undefined) {
    if (!translation) return [];

    // Split by commas first
    // Note: Some meanings might contain commas, but usually the dataset structure is comma-separated pairs.
    // A robust split might be needed if data is messy, but simple split is a good start.
    const parts = translation.split(/,(?![^()]*\))/); // split by comma, ignoring commas in parens if possible

    return parts.map(part => {
        const trimmed = part.trim();
        if (!trimmed) return null;

        // Attempt to split Devanagari from English
        // Regex looks for the end of the Devanagari/Sanskrit characters
        // Unicode range for Devanagari is \u0900-\u097F
        // We capture the Devanagari part (plus spaces/punctuation) and the rest
        const match = trimmed.match(/^([\u0900-\u097F\s\u200C\u200D\u0964\u0965:.-]+)(.*)$/);

        if (match && match[2]) {
            return {
                sanskrit: match[1].trim(),
                meaning: match[2].trim()
            };
        }

        // Fallback: if no clear separation, return as one chunk (rare)
        return {
            sanskrit: trimmed,
            meaning: ""
        };
    }).filter(item => item !== null) as { sanskrit: string; meaning: string }[];
}

export function ShlokaView({ shlokas }: ShlokaViewProps) {
    const [isStudyOpen, setIsStudyOpen] = useState(false);

    const shloka = shlokas[0]; // Primary logic uses first
    const shlokaNums = shlokas.map(s => s.shloka).join(" & ");

    // Process the data
    const wordList = parseWordByWord(shloka.translation); // "translation" field is actually the word-by-word
    const narrativeRunning = shloka.explanation; // "explanation" field is the narrative meaning
    const hasTransliteration = !!shloka.transliteration;

    return (
        <div
            className="py-12 first:pt-4 border-b border-stone-100 last:border-0 relative"
        >
            {/* Invisible Anchors for Deep Linking */}
            {shlokas.map(s => (
                <span key={s.shloka} id={`shloka-${s.shloka}`} className="absolute -top-24" />
            ))}

            {/* 1. Context Header */}
            <div className="flex items-center justify-center mb-6 opacity-60 hover:opacity-100 transition-opacity">
                <span className="text-[10px] md:text-xs font-bold tracking-[0.2em] text-stone-500 uppercase font-sans">
                    {shloka.kanda} · Sarga {shloka.sarga} · Shloka {shlokaNums}
                </span>
            </div>

            {/* 2. Primary Sanskrit Verse */}
            <div className="text-center mb-10 px-4">
                <div className="text-2xl md:text-3xl lg:text-4xl font-serif text-stone-800 leading-[1.6] md:leading-[1.8] font-medium tracking-wide">
                    {shloka.shloka_text
                        .replace(/([।]+(?:\s*[\d\.\-]+\s*[।]+)?)/g, '$1\n')
                        .split('\n')
                        .map(line => line.trim())
                        .filter(line => line.length > 0)
                        .map((part, index) => (
                            <span key={index} className="block mb-2 last:mb-0">
                                {part}
                            </span>
                        ))}
                </div>
                {/* Optional Transliteration */}
                {hasTransliteration && (
                    <p className="mt-4 text-sm md:text-base text-stone-500 font-mono italic opacity-80 max-w-2xl mx-auto">
                        {shloka.transliteration}
                    </p>
                )}
            </div>

            {/* 3. Sense (Narrative Meaning) */}
            <div className="max-w-prose mx-auto mb-12 px-6">
                <div className="relative">
                    {/* Decorative element */}
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 h-px bg-amber-200/50"></div>

                    <h4 className="text-center text-xs font-semibold text-amber-900/60 uppercase tracking-widest mb-4">
                        Sense
                    </h4>

                    {narrativeRunning ? (
                        <p className="text-lg md:text-xl text-stone-700 leading-relaxed text-center font-sans">
                            {narrativeRunning}
                        </p>
                    ) : (
                        <p className="text-stone-400 italic text-center">No narrative explanation available.</p>
                    )}
                </div>
            </div>

            {/* 4. Study Mode (Collapsed) */}
            {wordList.length > 0 && (
                <div className="max-w-2xl mx-auto px-4">
                    <div className="flex flex-col items-center">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsStudyOpen(!isStudyOpen)}
                            className={cn(
                                "group text-xs uppercase tracking-widest text-stone-400 hover:text-amber-800 hover:bg-amber-50/50 transition-all",
                                isStudyOpen && "text-amber-800 bg-amber-50/30"
                            )}
                        >
                            <span className="flex items-center gap-2">
                                {isStudyOpen ? <BookOpen className="w-3 h-3" /> : <Feather className="w-3 h-3" />}
                                {isStudyOpen ? "Close Study" : "Study Words"}
                                {isStudyOpen ? <ChevronUp className="w-3 h-3 ml-1 opacity-50" /> : <ChevronDown className="w-3 h-3 ml-1 opacity-50" />}
                            </span>
                        </Button>

                        {/* Collapsible Content */}
                        <div
                            className={cn(
                                "mt-6 w-full grid transition-all duration-500 ease-in-out overflow-hidden border-t border-stone-100",
                                isStudyOpen ? "grid-rows-[1fr] opacity-100 pt-6" : "grid-rows-[0fr] opacity-0 pt-0 border-none"
                            )}
                        >
                            <div className="min-h-0 bg-stone-50/50 rounded-lg p-1 md:p-6">
                                <div className="grid grid-cols-1 gap-y-3">
                                    {wordList.map((item, idx) => (
                                        <div key={idx} className="flex flex-col md:flex-row md:items-baseline border-b border-stone-200/50 last:border-0 pb-2 last:pb-0">
                                            <span className="text-lg font-serif text-stone-800 md:w-1/3 md:text-right md:pr-6 md:border-r md:border-stone-200/50">
                                                {item.sanskrit}
                                            </span>
                                            <span className="text-sm md:text-base text-stone-600 md:pl-6 md:w-2/3 pt-1 md:pt-0">
                                                {item.meaning || <span className="italic opacity-50">meaning unclear</span>}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
