'use client';

import { useState } from 'react';
import { T1Answer, T2Answer, T3Answer } from '@/lib/types/templates';
import { RetrievalResult, ShlokaMetadata } from '@/lib/types/retrieval';
import { T1AnswerCard } from './T1AnswerCard';
import { T2AnswerCard } from './T2AnswerCard';
import { T3RefusalCard } from './T3RefusalCard';
import { VerseDialog } from './VerseDialog';

interface AnswerDisplayProps {
    answer: T1Answer | T2Answer | T3Answer;
    question: string;
    retrieval?: RetrievalResult;
    onQuestionClick?: (question: string) => void;
}

export function AnswerDisplay({ answer, question, retrieval, onQuestionClick }: AnswerDisplayProps) {
    const [selectedShloka, setSelectedShloka] = useState<ShlokaMetadata | null>(null);
    const [isOverlayOpen, setIsOverlayOpen] = useState(false);

    const handleCitationClick = (metadata: ShlokaMetadata) => {
        setSelectedShloka(metadata);
        setIsOverlayOpen(true);
    };

    if (!answer) return null;

    if (answer.templateType === 'T3') {
        const t3Data = answer as T3Answer;
        return <T3RefusalCard data={t3Data} onQuestionClick={onQuestionClick} />;
    }

    if (answer.templateType === 'T2') {
        const t2Data = answer as T2Answer;
        return (
            <>
                <T2AnswerCard
                    data={t2Data}
                    question={question}
                    retrieval={retrieval}
                    onCitationClick={handleCitationClick}
                />
                <VerseDialog
                    open={isOverlayOpen}
                    onOpenChange={setIsOverlayOpen}
                    data={selectedShloka}
                />
            </>
        );
    }

    // Default T1
    const t1Data = answer as T1Answer;
    return (
        <>
            <T1AnswerCard
                data={t1Data}
                question={question}
                retrieval={retrieval}
                onCitationClick={handleCitationClick}
            />
            <VerseDialog
                open={isOverlayOpen}
                onOpenChange={setIsOverlayOpen}
                data={selectedShloka}
            />
        </>
    );
}
