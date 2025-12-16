'use client';

import { useSearchParams } from 'next/navigation';
import { Navigation } from '@/components/navigation';
import { AnswerCard } from '@/components/answer-card';
import { RefusalCard } from '@/components/refusal-card';

export default function QuestionPage() {
  const searchParams = useSearchParams();
  const isRefusal = searchParams.get('refusal') === 'true';

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />

      <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto px-6 pt-32 pb-20">
        {isRefusal ? <RefusalCard /> : <AnswerCard />}
      </main>
    </div>
  );
}
