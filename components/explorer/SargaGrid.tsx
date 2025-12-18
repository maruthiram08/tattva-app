'use client';

import { useState } from 'react';
import { SargaInfo } from "@/lib/data/ramayana";
import { SargaCard } from "@/components/explorer/SargaCard";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface SargaGridProps {
    kandaName: string;
    sargas: SargaInfo[];
}

const ITEMS_PER_PAGE = 9;

export function SargaGrid({ kandaName, sargas }: SargaGridProps) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(sargas.length / ITEMS_PER_PAGE);
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const currentSargas = sargas.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const goToNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));
    const goToPrev = () => setCurrentPage(p => Math.max(1, p - 1));

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {currentSargas.map((sarga) => (
                    <SargaCard
                        key={sarga.sargaNum}
                        kandaName={kandaName}
                        sargaNum={sarga.sargaNum}
                        title={sarga.title}
                        shlokaCount={sarga.shlokaCount}
                    />
                ))}
            </div>

            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 pt-4">
                    <Button
                        variant="outline"
                        onClick={goToPrev}
                        disabled={currentPage === 1}
                    >
                        <ChevronLeft className="w-4 h-4 mr-2" />
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {currentPage} of {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        onClick={goToNext}
                        disabled={currentPage === totalPages}
                    >
                        Next
                        <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                </div>
            )}
        </div>
    );
}
