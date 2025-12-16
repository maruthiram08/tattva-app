
'use client';

import { Book } from 'lucide-react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface CitationProps {
    citation: string;
}

export function Citation({ citation }: CitationProps) {
    return (
        <TooltipProvider>
            <Tooltip delayDuration={300}>
                <TooltipTrigger asChild>
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 mx-1 rounded-md bg-stone-100 border border-stone-200 text-[10px] font-medium text-stone-600 hover:bg-amber-50 hover:text-amber-700 hover:border-amber-200 transition-colors cursor-help align-middle">
                        <Book className="w-3 h-3" />
                        {citation}
                    </span>
                </TooltipTrigger>
                <TooltipContent className="bg-stone-900 border-stone-800 text-stone-50 p-3 shadow-xl max-w-sm">
                    <div className="space-y-1">
                        <p className="font-semibold text-amber-400 text-xs tracking-wider uppercase">{citation}</p>
                        <p className="text-xs text-stone-400 italic">Click to view full context (Coming soon)</p>
                    </div>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
