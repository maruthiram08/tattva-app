'use client';

import { ShlokaTyping } from './ShlokaTyping';

export function AnswerSkeleton() {
    return (
        <div className="w-full relative min-h-[400px]">
            {/* Shloka Typing Animation Overlay */}
            <ShlokaTyping />

            {/* Skeleton Content - Hidden but reserves space to prevent layout shift */}
            <div className="p-5 md:p-8 space-y-8 opacity-0 pointer-events-none">

                {/* Text Body Placeholders */}
                <div className="space-y-4">
                    <div className="h-4 bg-stone-200/50 rounded w-1/4 mb-6"></div> {/* Question Label */}
                    <div className="h-8 bg-stone-300/50 rounded w-3/4 mb-8"></div> {/* Heading */}

                    <div className="space-y-3">
                        <div className="h-4 bg-stone-200 rounded w-full"></div>
                        <div className="h-4 bg-stone-200 rounded w-[98%]"></div>
                        <div className="h-4 bg-stone-200 rounded w-[95%]"></div>
                        <div className="h-4 bg-stone-200 rounded w-[90%]"></div>
                    </div>
                    <div className="space-y-3 pt-4">
                        <div className="h-4 bg-stone-200 rounded w-[96%]"></div>
                        <div className="h-4 bg-stone-200 rounded w-full"></div>
                        <div className="h-4 bg-stone-200 rounded w-[92%]"></div>
                    </div>
                </div>

                <div className="h-px bg-stone-200 w-full my-8"></div>

                {/* Evidence Grid Placeholders */}
                <div className="space-y-4">
                    <div className="h-5 bg-stone-300/50 rounded w-48 mb-4"></div> {/* "Scriptural Evidence" Header */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="h-32 bg-stone-100 rounded-xl border border-stone-200/50"></div>
                        <div className="h-32 bg-stone-100 rounded-xl border border-stone-200/50"></div>
                        <div className="h-32 bg-stone-100 rounded-xl border border-stone-200/50 hidden md:block"></div>
                        <div className="h-32 bg-stone-100 rounded-xl border border-stone-200/50 hidden md:block"></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
