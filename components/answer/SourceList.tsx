import { BookOpen } from 'lucide-react';
import { RetrievalResult, ShlokaMetadata } from '@/lib/types/retrieval';
import { SourceCard } from './SourceCard';

interface SourceListProps {
    retrieval?: RetrievalResult;
    citations?: string[]; // Accepted but currently unused
    onCitationClick?: (data: ShlokaMetadata) => void;
}

export function SourceList({ retrieval, onCitationClick }: SourceListProps) {
    if (!retrieval || !retrieval.shlokas || retrieval.shlokas.length === 0) return null;

    // Deduplicate logic
    // Uniqueness based on: Kanda + Sarga + Shloka
    const uniqueShlokas = retrieval.shlokas.filter((shloka, index, self) =>
        index === self.findIndex((t) => {
            const m1 = t.metadata;
            const m2 = shloka.metadata;
            return m1.kanda === m2.kanda && m1.sarga === m2.sarga && m1.shloka === m2.shloka;
        })
    );

    return (
        <div className="mt-8 space-y-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
            <h3 className="font-serif text-lg text-stone-800 font-medium flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-amber-700" />
                Scriptural Evidence
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {uniqueShlokas.map((shloka, idx) => (
                    <SourceCard key={idx} shloka={shloka} index={idx} onCitationClick={onCitationClick} />
                ))}
            </div>
        </div>
    );
}
