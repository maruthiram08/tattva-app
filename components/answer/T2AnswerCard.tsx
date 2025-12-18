
'use client';


import { T2Answer } from '@/lib/types/templates';
import { RetrievalResult, ShlokaMetadata } from '@/lib/types/retrieval';
import { MessageCircle, Feather, AlertCircle, Copy, Share2, Library } from 'lucide-react';
import { CitationTooltip } from './CitationTooltip';
import { SourceList } from './SourceList';

interface T2AnswerCardProps {
    data: T2Answer;
    question: string;
    retrieval?: RetrievalResult;
    onCitationClick?: (data: ShlokaMetadata) => void;
}

export function T2AnswerCard({ data, question, retrieval, onCitationClick }: T2AnswerCardProps) {
    if (!data) return null;

    // Helper to render text with interactive citations
    const renderWithCitations = (text: string) => {
        if (!text) return null;
        // Regex to capture [Source X.Y], (Source X.Y) or inline Source X.Y patterns. Explicit Kanda names.
        const parts = text.split(/([\[\(]?(?:Bala|Ayodhya|Aranya|Kishkindha|Sundara|Yuddha|Uttara)\s+Kanda\s+\d+(?:[\.\-\s;,]+\d+)*[\]\)]?)/g);

        return parts.map((part, index) => {
            const isCitation = /^[\[\(]?(?:Bala|Ayodhya|Aranya|Kishkindha|Sundara|Yuddha|Uttara)\s+Kanda\s+\d+(?:[\.\-\s;,]+\d+)*[\]\)]?$/.test(part);

            if (isCitation) {
                const citationText = part.replace(/^[\[\(]|[\]\)]$/g, '');
                // Naive matcher for now
                const shlokaData = retrieval?.shlokas.find(s =>
                    citationText.toLowerCase().includes(s.metadata.kanda.toLowerCase().split(' ')[0]) &&
                    citationText.includes(String(s.metadata.sarga)) &&
                    citationText.includes(String(s.metadata.shloka))
                )?.metadata;

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
                    <div className="h-6 w-6 rounded-full bg-violet-100 flex items-center justify-center text-violet-700">
                        <MessageCircle className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">The Question (Interpretive)</span>
                </div>
                <h2 className="font-serif text-xl md:text-2xl leading-snug text-stone-900">
                    {question}
                </h2>
            </div>

            <div className="p-5 md:p-8 space-y-8">

                {/* Main Answer (Hero) */}
                {data.answer && (
                    <div className="prose prose-stone prose-lg max-w-none">
                        <div className="font-serif text-xl md:text-2xl font-medium leading-relaxed text-stone-900 whitespace-pre-wrap">
                            {renderWithCitations(data.answer)}
                        </div>
                    </div>
                )}


                {/* Main Answer Layout: Side-by-Side on Desktop - Progressive Disclosure */}
                {(data.whatTextStates?.length > 10 || data.traditionalInterpretations?.length > 10) && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in slide-in-from-bottom-2 duration-700">
                        {/* Column 1: What Text States */}
                        {data.whatTextStates && data.whatTextStates.length > 5 && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide flex items-center gap-2 border-b border-stone-100 pb-2">
                                    <Feather className="w-3.5 h-3.5 text-stone-400" /> What the Text States
                                </h4>
                                <div className="font-serif text-lg leading-relaxed text-stone-700 whitespace-pre-wrap">
                                    {renderWithCitations(data.whatTextStates)}
                                </div>
                            </div>
                        )}

                        {/* Column 2: Interpretations */}
                        {data.traditionalInterpretations && data.traditionalInterpretations.length > 5 && (
                            <div className="space-y-4">
                                <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide flex items-center gap-2 border-b border-stone-100 pb-2">
                                    <Library className="w-3.5 h-3.5 text-violet-500" /> Interpretations
                                </h4>
                                <div className="text-sm text-stone-600 leading-relaxed">
                                    {renderWithCitations(data.traditionalInterpretations)}
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Limit of Certainty (MANDATORY for T2) */}
                {data.limitOfCertainty && data.limitOfCertainty.length > 5 && (
                    <div className="bg-amber-50/60 border border-amber-100 rounded-2xl p-5 animate-in fade-in slide-in-from-bottom-2 duration-700">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="w-4 h-4 text-amber-600" />
                            <h4 className="text-xs font-semibold text-amber-800 uppercase tracking-wide">Limit of Certainty</h4>
                        </div>
                        <p className="text-sm text-stone-700 leading-relaxed">
                            {data.limitOfCertainty}
                        </p>
                    </div>
                )}

                <SourceList citations={(() => {
                    const allText = (data.answer || '') + (data.whatTextStates || '');
                    const matches = allText.match(/([\[\(]?(?:Bala|Ayodhya|Aranya|Kishkindha|Sundara|Yuddha|Uttara)\s+Kanda\s+\d+(?:[\.\-\s;,]+\d+)*[\]\)]?)/g);
                    return matches ? Array.from(new Set(matches.map(s => s.replace(/^[\[\(]|[\]\)]$/g, '')))) : [];
                })()} retrieval={retrieval} onCitationClick={onCitationClick} />

            </div>

            {/* Footer */}
            <div className="bg-stone-50 px-6 py-4 border-t border-stone-100 flex justify-between items-center text-xs">
                <span className="text-stone-400 font-medium bg-stone-100 px-2 py-1 rounded">Interpretive Answer (T2)</span>
                <div className="flex gap-2">
                    <button className="p-2 rounded-lg hover:bg-white hover:shadow-sm text-stone-400 hover:text-stone-900 transition-all" title="Copy">
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

