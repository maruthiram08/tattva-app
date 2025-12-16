'use client';

import { T3Answer } from '@/lib/types/templates';
import { ScrollText, ChevronRight } from 'lucide-react';

interface T3RefusalCardProps {
    data: T3Answer;
    onQuestionClick?: (question: string) => void;
}

export function T3RefusalCard({ data, onQuestionClick }: T3RefusalCardProps) {
    return (
        <div className="bg-white rounded-3xl shadow-medium border border-stone-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-2xl mx-auto">

            {/* Header */}
            <div className="bg-stone-50/50 border-b border-stone-100 p-6 md:p-8">
                <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-6 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                        <ScrollText className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider">Scope Boundary</span>
                </div>
                <h2 className="font-serif text-xl md:text-2xl leading-snug text-stone-900">
                    Beyond the Text
                </h2>
            </div>

            <div className="p-6 md:p-8 space-y-6">

                {/* Main Notice */}
                <p className="text-stone-700 leading-relaxed font-serif text-lg">
                    {data.outOfScopeNotice}
                </p>

                {/* Reasoning Box */}
                <div className="bg-stone-50 border border-stone-100 rounded-2xl p-5">
                    <h4 className="text-xs font-semibold text-stone-500 uppercase tracking-wide mb-2">Reasoning</h4>
                    <p className="text-sm text-stone-600 leading-relaxed">
                        {data.why}
                    </p>
                </div>

                {/* Suggestions */}
                {data.whatICanHelpWith && data.whatICanHelpWith?.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="text-xs font-semibold text-stone-900 uppercase tracking-wide flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-amber-500" /> Alternative Paths
                        </h4>
                        <div className="grid grid-cols-1 gap-2">
                            {data.whatICanHelpWith.map((altQ, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => onQuestionClick?.(altQ)}
                                    className="text-left px-4 py-3 rounded-xl border border-stone-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all text-sm font-medium text-stone-700 hover:text-stone-900"
                                >
                                    {altQ}
                                </button>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="bg-stone-50 px-6 py-4 border-t border-stone-100 flex justify-end">
                <button
                    onClick={() => window.location.reload()}
                    className="text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-900 transition-colors px-4 py-2 hover:bg-white hover:shadow-sm rounded-lg"
                >
                    Start New Inquiry
                </button>
            </div>

        </div>
    );
}
