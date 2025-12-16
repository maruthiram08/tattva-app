'use client';

import { ShlokaTyping } from './ShlokaTyping';

export function AnswerSkeleton() {
    return (
        <div className="w-full relative min-h-[400px]">
            {/* Shloka Typing Animation Overlay */}
            <ShlokaTyping />

            {/* Skeleton Content - Hidden as per user request */}
            {/* The container gives height, but we don't show the bars */}
            <div className="p-8 space-y-6 opacity-0 pointer-events-none">
                {/* Invisible spacer content to maintain height if needed, 
                     or just rely on min-h-[400px] from container. 
                     Let's keep the structure but invisible to ensure layout matching 
                     if we ever turn it back on, but opacity-0 hides it effectively. */}
                <div className="space-y-2">
                    <div className="h-4 bg-stone-200 rounded w-1/4"></div>
                    <div className="h-8 bg-stone-200 rounded w-3/4"></div>
                </div>
                <div className="h-px bg-stone-100 w-full"></div>
                <div className="space-y-4">
                    <div className="h-24 bg-stone-200 rounded"></div>
                    <div className="h-24 bg-stone-200 rounded"></div>
                </div>
            </div>
        </div>
    );
}
