'use client';

import React from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from '@/components/ui/hover-card';
import { ShlokaMetadata } from '@/lib/types/retrieval';
import { cn } from '@/lib/utils';

interface CitationTooltipProps {
    citation: string;
    data?: ShlokaMetadata;
    className?: string;
    onCitationClick?: (data: ShlokaMetadata) => void;
}

export function CitationTooltip({ citation, data, className, onCitationClick }: CitationTooltipProps) {
    // Construct explorer link
    let explorerLink = '/explorer';
    // Permissive regex to capture Kanda, Sarga, Shloka regardless of brackets/parens
    const parts = citation.match(/([a-zA-Z]+)\s+Kanda\s+(\d+)(?:\.(\d+)(?:-\d+)?)?/i);

    if (parts) {
        const shortKanda = parts[1];
        const kandaMap: Record<string, string> = {
            'Bala': 'Bala Kanda',
            'Ayodhya': 'Ayodhya Kanda',
            'Aranya': 'Aranya Kanda',
            'Kishkindha': 'Kishkindha Kanda',
            'Sundara': 'Sundara Kanda',
            'Yuddha': 'Yuddha Kanda',
            'Uttara': 'Uttara Kanda'
        };
        const fullKanda = kandaMap[shortKanda] || 'Bala Kanda';
        const sarga = parts[2] || '1';
        // const shloka = parts[3] || '1'; // Not used in URL path, but anchor?
        explorerLink = `/explorer/${fullKanda}/${sarga}`;
        if (parts[3]) {
            explorerLink += `#shloka-${parts[3]}`;
        }
    }

    const commonClasses = cn(
        "inline-flex items-center gap-0.5 px-1.5 py-0.5 mx-0.5 rounded-md bg-amber-50/50 border border-amber-200/50 text-[11px] font-semibold text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-colors cursor-pointer no-underline align-baseline whitespace-nowrap",
        className
    );

    return (
        <HoverCard openDelay={200} closeDelay={100}>
            <HoverCardTrigger asChild>
                {onCitationClick && data ? (
                    <span
                        onClick={() => onCitationClick(data)}
                        className={commonClasses}
                    >
                        {citation}
                    </span>
                ) : (
                    <Link
                        href={explorerLink}
                        className={commonClasses}
                    >
                        {citation}
                    </Link>
                )}
            </HoverCardTrigger>
            <HoverCardContent className="w-80 md:w-96 p-0 overflow-hidden bg-stone-50 border-stone-200 shadow-xl" align="start">

                {/* Header */}
                <div className="px-4 py-3 bg-white border-b border-stone-100 flex justify-between items-center">
                    <span className="font-bold text-amber-700 text-sm tracking-wide">{citation}</span>
                </div>

                {/* Content */}
                <div className="p-4 space-y-3 relative">
                    <div className="absolute inset-0 bg-[url('/texture-noise.png')] opacity-5 pointer-events-none" />

                    {data ? (
                        <>
                            {/* Sanskrit */}
                            <div className="space-y-1">
                                <p className="font-serif text-lg leading-relaxed text-stone-800 text-center text-balance">
                                    {data.shloka_text}
                                </p>
                            </div>

                            {/* Divider */}
                            <div className="w-12 h-px bg-stone-200 mx-auto" />

                            {/* English */}
                            <div className="space-y-1">
                                <p className="text-sm text-stone-600 leading-relaxed italic text-center text-balance">
                                    {data.explanation || data.translation}
                                </p>
                            </div>
                        </>
                    ) : (
                        <div className="py-4 text-center space-y-2">
                            <div className="animate-pulse space-y-2">
                                <div className="h-4 bg-stone-200 rounded w-3/4 mx-auto" />
                                <div className="h-4 bg-stone-200 rounded w-1/2 mx-auto" />
                                <div className="h-4 bg-stone-200 rounded w-5/6 mx-auto" />
                            </div>
                            <p className="text-xs text-stone-400 mt-2">Loading original verse...</p>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-stone-100/50 px-4 py-2 border-t border-stone-100 flex justify-end">
                    <div className="flex items-center gap-1 text-[10px] font-medium text-stone-500 uppercase tracking-wider group-hover:text-amber-600 transition-colors">
                        Click to explore <ExternalLink className="w-3 h-3" />
                    </div>
                </div>

            </HoverCardContent>
        </HoverCard>
    );
}
