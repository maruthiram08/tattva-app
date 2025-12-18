import React, { useState } from 'react';
import Link from 'next/link';
import { ChevronDown, ChevronUp, BookOpen, ExternalLink, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { RetrievalResult, RetrievedShloka, ShlokaMetadata } from '@/lib/types/retrieval';

interface SourceCardProps {
    shloka: RetrievedShloka;
    index: number;
    onCitationClick?: (data: ShlokaMetadata) => void;
}

export function SourceCard({ shloka, index, onCitationClick }: SourceCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const meta = shloka.metadata;

    const citation = `${meta.kanda} ${meta.sarga}.${meta.shloka}`;
    // Assuming 'Bala Kanda' -> 'Bala Kanda' in URL. If URL expects 'Bala', we might need to adjust.
    // Based on page.tsx params, it takes [kanda]. So 'Bala Kanda' is correct.
    const linkHref = `/explorer/${encodeURIComponent(meta.kanda)}/${meta.sarga}#shloka-${meta.shloka}`;

    return (
        <div className="group relative flex flex-col bg-white border border-stone-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            {/* Header / Summary View */}
            <div
                className="flex items-start justify-between p-4 cursor-pointer hover:bg-stone-50/50 transition-colors"
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex-grow pr-4">
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-amber-700 uppercase tracking-widest border border-amber-100 bg-amber-50 px-2 py-0.5 rounded-full">
                            Evidence {index + 1}
                        </span>
                        <span className="text-xs font-serif text-stone-400 italic">
                            {citation}
                        </span>
                    </div>
                    {/* Meaning Snippet (Sense) */}
                    <p className="text-sm text-stone-700 font-serif leading-relaxed line-clamp-2 group-hover:text-stone-900 transition-colors">
                        {meta.explanation || meta.translation}
                    </p>
                </div>

                <button
                    className="p-1 text-stone-400 group-hover:text-amber-600 transition-colors"
                    aria-label={isOpen ? "Collapse" : "Expand"}
                >
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
            </div>

            {/* Expanded Content (Sanskrit + Word-by-Word) */}
            <div className={cn(
                "grid transition-all duration-500 ease-in-out border-t border-stone-100 bg-stone-50/30",
                isOpen ? "grid-rows-[1fr] opacity-100 p-4" : "grid-rows-[0fr] opacity-0 p-0 border-none"
            )}>
                <div className="overflow-hidden min-h-0 space-y-4">
                    {/* Sanskrit Verse */}
                    <div className="text-center py-2">
                        <p className="font-serif text-xl text-stone-800 leading-loose whitespace-pre-wrap font-medium">
                            {meta.shloka_text}
                        </p>
                    </div>

                    {/* Word by Word (Study) if available */}
                    {meta.translation && (
                        <div className="text-xs text-stone-500 font-mono bg-white p-3 rounded-lg border border-stone-100">
                            {meta.translation}
                        </div>
                    )}

                    {/* Context Link */}
                    <div className="flex justify-end pt-2">
                        {onCitationClick ? (
                            <button
                                onClick={() => onCitationClick(meta)}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 uppercase tracking-wider group/link"
                            >
                                Read Context
                                <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                            </button>
                        ) : (
                            <Link
                                href={linkHref}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 hover:text-amber-800 uppercase tracking-wider group/link"
                            >
                                Read Context
                                <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
