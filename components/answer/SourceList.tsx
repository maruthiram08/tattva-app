
import { ArrowRight, BookOpen } from 'lucide-react';
import { RetrievalResult, ShlokaMetadata } from '@/lib/types/retrieval';
import Link from 'next/link';

interface SourceListProps {
    citations: string[];
    retrieval?: RetrievalResult;
    onCitationClick?: (data: ShlokaMetadata) => void;
}

export function SourceList({ citations, retrieval, onCitationClick }: SourceListProps) {
    if (!citations || citations.length === 0) return null;

    // Deduplicate citations
    const uniqueCitations = Array.from(new Set(citations));

    return (
        <div className="mt-12 pt-8 border-t border-stone-100">
            <h3 className="font-serif text-lg text-stone-800 mb-6 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-stone-400" />
                References
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uniqueCitations.map((citation, idx) => {
                    // Helper to get snippet if possible, or generic text
                    // For now, we will link to explorer placeholder
                    // Parse citation to build link: [Kanda] Kanda [Sarga].[Shloka]
                    const parts = citation.match(/([a-zA-Z]+)\s+Kanda\s+(\d+)(?:\.(\d+)(?:-\d+)?)?/i);
                    let linkHref = '/explorer';
                    let snippet = 'View in Explorer';
                    let found: { metadata: ShlokaMetadata } | undefined;

                    if (parts) {
                        const shortKanda = parts[1];
                        // Kanda Mapping
                        const kandaMap: Record<string, { num: number, full: string }> = {
                            'Bala': { num: 1, full: 'Bala Kanda' },
                            'Ayodhya': { num: 2, full: 'Ayodhya Kanda' },
                            'Aranya': { num: 3, full: 'Aranya Kanda' },
                            'Kishkindha': { num: 4, full: 'Kishkindha Kanda' },
                            'Sundara': { num: 5, full: 'Sundara Kanda' },
                            'Yuddha': { num: 6, full: 'Yuddha Kanda' },
                            'Uttara': { num: 7, full: 'Uttara Kanda' }
                        };

                        const kandaInfo = kandaMap[shortKanda] || { num: 1, full: 'Bala Kanda' };
                        const sargaNum = parts[2];
                        const shlokaNum = parts[3] || '1';

                        // Build Link using Full Kanda Name
                        linkHref = `/explorer/${kandaInfo.full}/${sargaNum}#shloka-${shlokaNum}`;

                        // Try to find matching shloka in retrieval for snippet
                        found = retrieval?.shlokas.find(s =>
                            s.metadata.kanda_number === kandaInfo.num &&
                            s.metadata.sarga === parseInt(sargaNum) &&
                            s.metadata.shloka === parseInt(shlokaNum)
                        );
                        if (found?.metadata?.translation) {
                            // First 12 words
                            snippet = found.metadata.translation.split(' ').slice(0, 12).join(' ') + '...';
                        }
                    }

                    if (onCitationClick && found?.metadata) {
                        return (
                            <div
                                key={idx}
                                onClick={() => onCitationClick(found.metadata)}
                                className="group block p-4 rounded-xl border border-stone-100 bg-stone-50/30 hover:bg-white hover:border-amber-200 hover:shadow-sm transition-all duration-300 cursor-pointer"
                            >
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="font-serif text-stone-900 font-medium group-hover:text-amber-800 transition-colors">
                                            {citation}
                                        </p>
                                        <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                                            {snippet}
                                        </p>
                                    </div>
                                    <BookOpen className="w-4 h-4 text-stone-300 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        );
                    }

                    return (
                        <Link
                            key={idx}
                            href={linkHref}
                            className="group block p-4 rounded-xl border border-stone-100 bg-stone-50/30 hover:bg-white hover:border-amber-200 hover:shadow-sm transition-all duration-300"
                        >
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <p className="font-serif text-stone-900 font-medium group-hover:text-amber-800 transition-colors">
                                        {citation}
                                    </p>
                                    <p className="text-xs text-stone-500 line-clamp-2 leading-relaxed">
                                        {snippet}
                                    </p>
                                </div>
                                <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                            </div>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
