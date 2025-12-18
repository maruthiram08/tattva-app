
'use client';


import { T1Answer } from '@/lib/types/templates';
import { RetrievalResult, ShlokaMetadata } from '@/lib/types/retrieval';
import { MessageCircle, Feather, Copy, Share2 } from 'lucide-react';
import { CitationTooltip } from './CitationTooltip';
import { SourceList } from './SourceList';

interface T1AnswerCardProps {
    data: T1Answer;
    question: string;
    retrieval?: RetrievalResult;
    onCitationClick?: (data: ShlokaMetadata) => void;
}

export function T1AnswerCard({ data, question, retrieval, onCitationClick }: T1AnswerCardProps) {
    // Simple check to ensure we have valid data
    if (!data) return null;

    // Helper to render text with interactive citations
    const renderAnswerWithCitations = (text: string) => {
        if (!text) return null;
        // Regex to capture [Source X.Y], (Source X.Y) or inline Source X.Y patterns.
        // matches explicit Kanda names to avoid capturing preceding text like "as stated in".
        const parts = text.split(/([\[\(]?(?:Bala|Ayodhya|Aranya|Kishkindha|Sundara|Yuddha|Uttara)\s+Kanda\s+\d+(?:[\.\-\s;,]+\d+)*[\]\)]?)/g);

        return parts.map((part, index) => {
            // Check if this part is a citation tag
            const isCitation = /^[\[\(]?(?:Bala|Ayodhya|Aranya|Kishkindha|Sundara|Yuddha|Uttara)\s+Kanda\s+\d+(?:[\.\-\s;,]+\d+)*[\]\)]?$/.test(part);

            if (isCitation) {
                // Remove brackets/parentheses
                const citationText = part.replace(/^[\[\(]|[\]\)]$/g, '');

                // Find matching shloka data if available
                const shlokaData = retrieval?.shlokas.find(s => {
                    // Normalize to check text
                    const kandaMatch = citationText.toLowerCase().includes(s.metadata.kanda.toLowerCase().split(' ')[0]);
                    const sargaMatch = citationText.includes(String(s.metadata.sarga));
                    const shlokaMatch = citationText.includes(String(s.metadata.shloka));
                    return kandaMatch && sargaMatch && shlokaMatch;
                })?.metadata;

                return (
                    <CitationTooltip
                        key={index}
                        citation={part}
                        data={shlokaData}
                        className="mx-0.5"
                        onCitationClick={onCitationClick}
                    />
                );
            }
            return part;
        });
    };

    return (
        <div className="bg-white rounded-3xl shadow-medium border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Question Header */}
            <div className="bg-stone-50/50 border-b border-stone-100 p-5 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-amber-100 flex items-center justify-center text-amber-900">
                        <MessageCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">The Question</span>
                </div>
                <h2 className="font-serif text-xl md:text-2xl leading-snug text-stone-900">
                    {question}
                </h2>
            </div>

            <div className="p-5 md:p-8 space-y-8">

                {/* Main Answer */}
                <div className="prose prose-stone prose-lg max-w-none">
                    <div className="font-serif text-xl md:text-2xl font-medium leading-relaxed text-stone-900 whitespace-pre-wrap">
                        {renderAnswerWithCitations(data.answer)}
                    </div>
                </div>


                {/* Textual Basis / Explanations - Progressive Disclosure */}
                {data.explanation && data.explanation.length > 10 && (
                    <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100 animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <div className="flex items-center gap-2 mb-3">
                            <Feather className="w-4 h-4 text-amber-700" />
                            <span className="text-xs font-semibold text-stone-900 uppercase tracking-wide">Scriptural Authority</span>
                        </div>
                        <p className="text-sm text-stone-600 leading-relaxed italic">
                            {data.explanation}
                        </p>
                    </div>
                )}

                {/* Sources Footer */}
                <SourceList citations={data.textualBasis?.citations || []} retrieval={retrieval} onCitationClick={onCitationClick} />

            </div>

            {/* Footer */}
            <div className="bg-stone-50 px-6 py-4 border-t border-stone-100 flex justify-between items-center text-xs">
                <span className="text-stone-400 font-medium bg-stone-100 px-2 py-1 rounded">Textual Answer (T1)</span>
                <div className="flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-stone-400 hover:text-stone-900 transition-all" title="Copy Answer">
                        <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-stone-400 hover:text-stone-900 transition-all" title="Share">
                        <Share2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>

        </div>
    );
}
