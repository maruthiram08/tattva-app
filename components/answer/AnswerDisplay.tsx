
'use client';

import { Answer, T1Answer, T2Answer, T3Answer } from '@/lib/types/templates';
import { T1AnswerCard } from './T1AnswerCard';
import { T2AnswerCard } from './T2AnswerCard';
import { T3RefusalCard } from './T3RefusalCard';
import { AnswerSkeleton } from './AnswerSkeleton';

interface AnswerDisplayProps {
    answer: Answer;
    question: string;
    onQuestionClick?: (q: string) => void;
}

export function AnswerDisplay({ answer, question, onQuestionClick }: AnswerDisplayProps) {
    if (!answer) return null;
    if (!answer.templateType) return <AnswerSkeleton />;

    switch (answer.templateType) {
        case 'T1':
            return <T1AnswerCard data={answer as T1Answer} question={question} />;
        case 'T2':
            return <T2AnswerCard data={answer as T2Answer} question={question} />;
        case 'T3':
            return <T3RefusalCard data={answer as T3Answer} onQuestionClick={onQuestionClick} />;
        default:
            return (
                <div className="bg-red-50 p-4 rounded-lg text-red-600">
                    Error: Unknown answer template type
                </div>
            );
    }
}
