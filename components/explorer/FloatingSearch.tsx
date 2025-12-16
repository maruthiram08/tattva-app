"use client";

import Image from "next/image";

export function FloatingSearch() {
    return (
        <div className="fixed bottom-4 md:bottom-8 left-1/2 -translate-x-1/2 z-50 animate-[fadeIn_1s_ease-out_1s_both]">
            <button
                className="bg-stone-900 hover:bg-stone-800 text-stone-50 pl-5 pr-6 py-3.5 rounded-full shadow-medium flex items-center gap-3 transition-all duration-300 hover:scale-105 group border border-stone-700"
                onClick={() => console.log('Search clicked')}
            >
                <div className="relative w-8 h-8">
                    <Image
                        src="/favicon_light.png"
                        alt="Tattva"
                        fill
                        className="object-contain opacity-90 group-hover:animate-pulse"
                    />
                </div>
                <span className="font-serif italic pr-1 text-sm text-stone-200">Ask Tattva...</span>
                <span className="hidden md:inline-flex h-5 items-center justify-center rounded border border-stone-700 bg-stone-800 px-1.5 font-sans text-[10px] font-medium text-stone-400 ml-2">⌘K</span>
            </button>
        </div>
    );
}
