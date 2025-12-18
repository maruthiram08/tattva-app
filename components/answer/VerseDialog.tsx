'use client';

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ShlokaMetadata } from '@/lib/types/retrieval';
import { ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface VerseDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    data: ShlokaMetadata | null;
}

export function VerseDialog({ open, onOpenChange, data }: VerseDialogProps) {
    if (!data) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[90vw] md:max-w-2xl max-h-[85vh] overflow-y-auto bg-stone-50 border-stone-200">
                <DialogHeader className="mb-6">
                    <DialogTitle className="font-serif text-2xl text-center text-amber-900">
                        {data.kanda} {data.sarga}.{data.shloka}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-8 pb-4">
                    {/* Sanskrit */}
                    <div className="space-y-3">
                        <p className="font-serif text-xl md:text-3xl leading-loose text-center text-stone-900 p-2 md:p-6">
                            {data.shloka_text}
                        </p>
                    </div>

                    {/* Explanation */}
                    <div className="space-y-3">
                        <div className="text-lg text-stone-700 leading-relaxed space-y-4 text-center">
                            <p>{data.explanation || data.translation}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-4 flex justify-center border-t border-stone-200/50 mt-8">
                        <Button variant="outline" asChild className="gap-2 group bg-white hover:bg-amber-50 border-stone-200 hover:border-amber-200 text-stone-600 hover:text-amber-800">
                            <Link href={`/explorer/${data.kanda}/${data.sarga}#shloka-${data.shloka}`}>
                                View in Full Context
                                <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
