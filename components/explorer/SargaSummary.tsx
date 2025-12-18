'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Feather, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SargaSummaryProps {
    summary: string;
}

export function SargaSummary({ summary }: SargaSummaryProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!summary) return null;

    return (
        <Card id="story-section" className="mb-12 bg-stone-50/80 border-stone-200/60 shadow-sm overflow-hidden scroll-mt-24 transition-all duration-300">
            <CardHeader className="bg-amber-100/20 border-b border-stone-100 pb-4">
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
                    <CardTitle className="flex items-center gap-2 text-xl font-serif text-amber-900/80">
                        <Feather className="w-5 h-5" />
                        The Story
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-stone-400 hover:text-amber-800 p-0 h-auto hover:bg-transparent"
                    >
                        {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </Button>
                </div>
            </CardHeader>

            <CardContent className="relative p-0 transition-all duration-500">
                <div
                    className={`prose prose-stone prose-lg max-w-none font-serif text-stone-700 leading-loose p-6 md:p-8 transition-all duration-700 ease-in-out ${isOpen ? 'max-h-none opacity-100' : 'max-h-[180px] overflow-hidden opacity-90'
                        }`}
                >
                    {summary.split('\n\n').map((paragraph, idx) => (
                        <p key={idx} className="mb-4 last:mb-0">
                            {paragraph}
                        </p>
                    ))}
                </div>

                {/* Gradient Overlay when collapsed */}
                {!isOpen && (
                    <div
                        className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-stone-50 via-stone-50/80 to-transparent flex items-end justify-center pb-6 cursor-pointer hover:from-amber-50/90 transition-all duration-500 group"
                        onClick={() => setIsOpen(true)}
                    >
                        <Button variant="ghost" size="sm" className="text-stone-500 group-hover:text-amber-800 font-serif italic">
                            Read full story <ChevronDown className="w-4 h-4 ml-1 animate-bounce" />
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
