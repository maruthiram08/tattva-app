import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp } from 'lucide-react';
import { RetrievalResult, ShlokaMetadata } from '@/lib/types/retrieval';
import { SourceCard } from './SourceCard';

interface SourceListProps {
    retrieval?: RetrievalResult;
    citations?: string[]; // Accepted but currently unused
    onCitationClick?: (data: ShlokaMetadata) => void;
}

export function SourceList({ retrieval, onCitationClick }: SourceListProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!retrieval || !retrieval.shlokas || retrieval.shlokas.length === 0) return null;

    // Deduplicate logic
    const uniqueShlokas = retrieval.shlokas.filter((shloka, index, self) =>
        index === self.findIndex((t) => {
            const m1 = t.metadata;
            const m2 = shloka.metadata;
            return m1.kanda === m2.kanda && m1.sarga === m2.sarga && m1.shloka === m2.shloka;
        })
    );

    const DISPLAY_LIMIT = 4;
    const hasMore = uniqueShlokas.length > DISPLAY_LIMIT;
    const displayedShlokas = isExpanded ? uniqueShlokas : uniqueShlokas.slice(0, DISPLAY_LIMIT);

    return (
        <div className="mt-8 space-y-4 animate-in fade-in duration-300">
            <h3 className="font-serif text-lg text-stone-800 font-medium flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                Scriptural Evidence
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4 transition-all duration-500 ease-in-out">
                {displayedShlokas.map((shloka, idx) => (
                    <SourceCard key={idx} shloka={shloka} index={idx} onCitationClick={onCitationClick} />
                ))}
            </div>

            {hasMore && (
                <div className="flex justify-center pt-2">
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="flex items-center gap-2 px-4 py-2 bg-stone-50 border border-stone-200 rounded-full text-stone-500 text-sm font-medium hover:bg-stone-100 hover:text-amber-700 transition-colors shadow-sm"
                    >
                        {isExpanded ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                Show Less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                Show {uniqueShlokas.length - DISPLAY_LIMIT} more sources
                            </>
                        )}
                    </button>
                </div>
            )}
        </div>
    );
}
