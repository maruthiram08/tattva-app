'use client';

import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { ShlokaMetadata } from '@/lib/types/retrieval';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface VerseOverlayProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: ShlokaMetadata | null;
}

export function VerseOverlay({ open, onOpenChange, data }: VerseOverlayProps) {
    if (!data) return null;

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
                <SheetHeader className="mb-8">
                    <SheetTitle className="font-serif text-2xl text-amber-900 border-b border-amber-100 pb-4">
                        {data.kanda} {data.sarga}.{data.shloka}
                    </SheetTitle>
                    {/* <SheetDescription>
                        Context from the Valmiki Ramayana
                    </SheetDescription> */}
                </SheetHeader>

                <div className="space-y-8">
                    {/* Sanskrit */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-8 h-px bg-stone-200"></span>
                            Sanskrit
                            <span className="w-8 h-px bg-stone-200"></span>
                        </h4>
                        <p className="font-serif text-xl md:text-2xl leading-loose text-center text-stone-900 bg-stone-50 p-6 rounded-xl border border-stone-100">
                            {data.shloka_text}
                        </p>
                    </div>

                    {/* Translation */}
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-8 h-px bg-stone-200"></span>
                            Translation
                            <span className="w-8 h-px bg-stone-200"></span>
                        </h4>
                        <div className="text-lg text-stone-700 leading-relaxed space-y-4">
                            {data.translation ? (
                                data.translation.split(',').map((t, i) => (
                                    <p key={i}>{t.trim()}</p>
                                ))
                            ) : (
                                <p className="italic text-stone-500">{data.explanation}</p>
                            )}
                        </div>
                    </div>

                    {/* Explanation */}
                    {data.explanation && data.translation && (
                        <div className="space-y-2 bg-amber-50/50 p-4 rounded-lg border border-amber-100/50">
                            <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Commentary</h4>
                            <p className="text-sm text-amber-900/80 leading-relaxed italic">
                                {data.explanation}
                            </p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="pt-8 flex justify-center">
                        <Button variant="outline" asChild className="gap-2 group">
                            <Link href={`/explorer/${data.kanda}/${data.sarga}#shloka-${data.shloka}`}>
                                Open in Explorer
                                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
