import { getShlokas, getSargas, getSargaSummary } from "@/lib/data/ramayana";
import { ShlokaView } from "@/components/explorer/ShlokaView";
import { SargaSummary } from "@/components/explorer/SargaSummary";
import { SargaNavigation } from "@/components/explorer/SargaNavigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { ScrollToHash } from "@/components/explorer/ScrollToHash";
import { BackToTop } from "@/components/ui/back-to-top";


interface Props {
    params: {
        kanda: string;
        sarga: string;
    };
    searchParams: {
        page?: string;
    };
}

export async function generateMetadata({ params }: Props) {
    const kandaName = decodeURIComponent(params.kanda);
    return {
        title: `Sarga ${params.sarga} | ${kandaName}`,
    };
}

export default async function SargaPage({ params, searchParams }: Props) {
    const kandaName = decodeURIComponent(params.kanda);
    const sargaNum = parseInt(params.sarga, 10);

    const allShlokas = await getShlokas(kandaName, sargaNum);

    if (!allShlokas || allShlokas.length === 0) {
        notFound();
    }

    // Pagination Logic
    const page = parseInt(searchParams.page || '1', 10);
    const pageSize = 20;
    const totalShlokas = allShlokas.length;
    const totalPages = Math.ceil(totalShlokas / pageSize);

    console.log(`DEBUG: Sarga ${sargaNum}, Shlokas: ${totalShlokas}, Pages: ${totalPages}, Current: ${page}`);

    // Validate page number
    // if (page < 1 || (totalPages > 0 && page > totalPages)) { }

    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const displayedShlokas = allShlokas.slice(startIndex, endIndex);

    // Deduplicate/Group consecutive identical shlokas
    const groupedShlokas: typeof displayedShlokas[] = [];
    if (displayedShlokas.length > 0) {
        let currentGroup = [displayedShlokas[0]];
        for (let i = 1; i < displayedShlokas.length; i++) {
            const current = displayedShlokas[i];
            const prev = currentGroup[0];
            // Group if texts match
            if (current.shloka_text === prev.shloka_text) {
                currentGroup.push(current);
            } else {
                groupedShlokas.push(currentGroup);
                currentGroup = [current];
            }
        }
        groupedShlokas.push(currentGroup);
    }

    // Fetch sarga info to get the proper title/summary
    const sargas = await getSargas(kandaName);
    const currentSargaInfo = sargas.find(s => s.sargaNum === sargaNum);

    // Use the title from the JSON dataset as the summary
    const summary = currentSargaInfo?.title;
    const storySummary = await getSargaSummary(kandaName, sargaNum);

    // Helper to render combined pagination controls
    const renderCombinedPagination = () => (
        <div className="flex flex-wrap items-center justify-center gap-3 py-4 w-full">
            {/* Prev */}
            <Button
                variant="ghost"
                size="sm"
                asChild
                disabled={page <= 1}
                className={page <= 1 ? "opacity-50 pointer-events-none text-muted-foreground" : "text-stone-600 hover:text-stone-900"}
            >
                <Link href={page > 1 ? `?page=${page - 1}` : '#'}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                </Link>
            </Button>

            {/* Pills */}
            <div className="flex flex-wrap justify-center gap-2">
                {Array.from({ length: totalPages }).map((_, i) => {
                    const p = i + 1;
                    const start = (p - 1) * pageSize + 1;
                    const end = Math.min(p * pageSize, totalShlokas);
                    const isCurrent = p === page;
                    return (
                        <Link
                            key={p}
                            href={`?page=${p}`}
                            className={`px-3 py-1.5 text-xs rounded-full border transition-colors whitespace-nowrap ${isCurrent
                                ? "bg-amber-100 border-amber-300 text-amber-900 font-medium"
                                : "bg-white border-stone-200 text-stone-600 hover:bg-stone-50 hover:border-amber-200"
                                }`}
                        >
                            {start}-{end}
                        </Link>
                    );
                })}
            </div>

            {/* Next */}
            <Button
                variant="ghost"
                size="sm"
                asChild
                disabled={page >= totalPages}
                className={page >= totalPages ? "opacity-50 pointer-events-none text-muted-foreground" : "text-stone-600 hover:text-stone-900"}
            >
                <Link href={page < totalPages ? `?page=${page + 1}` : '#'}>
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
            </Button>
        </div>
    );

    return (
        <div className="space-y-8 max-w-3xl mx-auto px-4 md:px-0">
            <ScrollToHash />
            <div className="text-center border-b pb-8">
                <div className="flex justify-start mb-6">
                    <Link
                        href={`/explorer/${params.kanda}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 text-stone-600 hover:text-stone-900 group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-sm font-medium">{kandaName}</span>
                    </Link>
                </div>
                <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">{kandaName}</h2>
                <h1 className="text-4xl font-bold font-serif">Sarga {sargaNum}</h1>
                {summary && (
                    <p className="mt-4 text-base italic text-muted-foreground/80 max-w-xl mx-auto">
                        {summary}
                    </p>
                )}
            </div>

            <SargaNavigation />

            {storySummary && <SargaSummary summary={storySummary} />}

            {/* Top Pagination */}
            {totalPages >= 1 && (
                <div className="flex flex-col items-center">
                    <p className="text-xs text-muted-foreground mb-2">
                        Showing {startIndex + 1}-{Math.min(endIndex, totalShlokas)} of {totalShlokas} Shlokas
                    </p>
                    {renderCombinedPagination()}
                </div>
            )}

            <div id="shlokas-section" className="space-y-2 scroll-mt-24">
                {groupedShlokas.map((group) => (
                    <ShlokaView key={group[0].shloka} shlokas={group} />
                ))}
            </div>

            {/* Bottom Pagination */}
            {totalPages >= 1 && (
                <div className="py-4">
                    {renderCombinedPagination()}
                </div>
            )}

            <div className="flex justify-between pt-8 border-t">
                <Button variant="ghost" asChild>
                    <Link href={`/explorer/${params.kanda}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to {kandaName}
                    </Link>
                </Button>
            </div>

            <BackToTop />
        </div>
    );
}
