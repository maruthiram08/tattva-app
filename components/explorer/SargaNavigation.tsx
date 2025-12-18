'use client';

import { Feather, BookOpen } from "lucide-react";

export function SargaNavigation() {
    const scrollToSection = (id: string) => {
        const element = document.getElementById(id);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    };

    return (
        <div className="flex justify-center gap-4 my-6">
            <button
                onClick={() => scrollToSection('story-section')}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-900 border border-stone-200 transition-colors text-sm font-medium"
            >
                <Feather className="w-4 h-4" />
                Story
            </button>
            <button
                onClick={() => scrollToSection('shlokas-section')}
                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-stone-100 hover:bg-amber-100 text-stone-600 hover:text-amber-900 border border-stone-200 transition-colors text-sm font-medium"
            >
                <BookOpen className="w-4 h-4" />
                Shlokas
            </button>
        </div>
    );
}
