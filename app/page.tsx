'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import { useState, useEffect } from 'react';
import { ChevronLeft, Clock, X } from 'lucide-react';
import { Answer } from '@/lib/types/templates';
import { FloatingQuestionInput } from '@/components/question/FloatingQuestionInput';
import { AnswerDisplay } from '@/components/answer/AnswerDisplay';
import { AnswerSkeleton } from '@/components/answer/AnswerSkeleton';

// Define minimal schema for client-side typing/validation
const AnswerSchema = z.any();

const QUESTIONS_BY_CATEGORY: Record<string, string[]> = {
  "Philosophy": [
    "Why did Rama kill Vali from behind a tree?",
    "What does the Ramayana say about ruling a kingdom?",
    "How does Kausalya react to Rama's exile?",
    "Why did Rama prioritize his duty as a King over his role as a husband?",
  ],
  "Character": [
    "Who is Indrajit and what were his powers?",
    "Why is Hanuman called 'Sundara'?",
    "Compare the characters of Ravana and Kumbhakarna.",
    "Who is Hanuman?",
  ],
  "Dharma": [
    "Is Vibhishana's defection to Rama considered Adharma?",
    "Why did Rama test Sita with the Agni Pariksha?",
    "Was Dasharatha right in banishing Rama?",
  ],
  "Narrative": [
    "How did Jatayu try to save Sita?",
    "How was the bridge to Lanka constructed?",
    "What happened in the Ashoka Vatika?",
  ],
  "Symbolism": [
    "What is the significance of the Golden Deer?",
    "What does the Pushpaka Vimana represent?",
  ],
  "Relationship": [
    "Describe the bond between Rama and Guha.",
    "Describe the loyalty of Lakshmana.",
    "How did Sita support Rama during the exile?",
  ]
};

interface HistoryItem {
  question: string;
  answer: Answer;
  timestamp: number;
}

export default function HomePage() {
  const [displayedQuestion, setDisplayedQuestion] = useState('');
  // const [resetKey, setResetKey] = useState(0);
  const [suggestions, setSuggestions] = useState<{ category: string; text: string }[]>([]);

  // History State
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [staticAnswer, setStaticAnswer] = useState<Answer | null>(null);

  // Initialize Streaming Hook
  const { object, submit, isLoading, error, stop } = useObject({
    api: '/api/answer',
    schema: AnswerSchema,
    onFinish: ({ object }) => {
      // Optional: Save interaction
      if (object) {
        window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: true } }));
      } else {
        console.warn("Stream finished with empty object");
        // Ensure header stays visible if failed
        window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: false } }));
      }
    },
    onError: (err) => {
      console.error('Streaming error:', err);
      window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: false } }));
    }
  });

  const streamingAnswer = object as Answer | undefined;
  // Prefer static answer (restored from history) over streaming answer,
  // but if loading, prefer streaming (since static is cleared on new search)
  const currentAnswer = isLoading ? streamingAnswer : (staticAnswer || streamingAnswer);

  useEffect(() => {
    // ... suggestions logic ...
    const categories = Object.keys(QUESTIONS_BY_CATEGORY);
    const shuffledCats = [...categories].sort(() => 0.5 - Math.random());
    const selectedCats = shuffledCats.slice(0, 4);

    const newSuggestions = selectedCats.map(cat => {
      const questions = QUESTIONS_BY_CATEGORY[cat];
      const randomQ = questions[Math.floor(Math.random() * questions.length)];
      return { category: cat, text: randomQ };
    });

    setSuggestions(newSuggestions);
  }, []);

  // Manage Focus Mode (Header Visibility)
  useEffect(() => {
    // Hide header if we have an answer OR if we are currently loading (Focus Mode)
    if (!!currentAnswer || isLoading) {
      window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: true } }));
    } else {
      window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: false } }));
    }
  }, [currentAnswer, isLoading]);

  const saveCurrentToHistory = () => {
    if (currentAnswer && displayedQuestion && !isLoading) {
      // Avoid duplicates at the top
      setHistory(prev => {
        if (prev.length > 0 && prev[0].question === displayedQuestion) return prev;
        return [{ question: displayedQuestion, answer: currentAnswer, timestamp: Date.now() }, ...prev];
      });
    }
  };

  const resetState = () => {
    saveCurrentToHistory();
    stop(); // Stop any active stream
    setStaticAnswer(null); // Clear static
    setDisplayedQuestion('');
    // setResetKey(prev => prev + 1); // Force re-mount of hook/state if needed, or just rely on new submission.
    // Actually useObject state persists. To clear it, we might need a key on the component using it, or just ignore it.
    // Better way: Re-mount the component or `submit` clears it?
    // Usually submit clears. But we want to go back to "Empty" state.
    // Let's us `resetKey` to force re-render of the hook? No hooks can't be conditional.
    // We can just set a local `isCleared` flag?
    // Or simpler: `window.location.reload()` is too harsh.
    // Let's TRY: `submit(undefined)`? No.
    // Let's use a wrapper component for the Answer part?
    // For now, let's just Refresh suggestions and rely on `displayedQuestion` to guide UI?
    // No, `answer` (object) will still be there.
    // Let's use `window.location.href = '/'`? No.
    // `useObject` doesn't have a clear `reset` function in early versions.
    // WORKAROUND: We will wrap the `useObject` inside a sub-component `<AnswerStreamer />` that we mount/unmount.
    // This is the cleanest way to reset hook state.

    // BUT refactoring to sub-component is large.
    // Alternative: `setDisplayedQuestion('')` is done.
    // We can ignore `object` if `displayedQuestion` is empty.

    setDisplayedQuestion('');
    // setError(''); // Handled by hook?
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Show Header
    window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: false } }));

    // Refresh suggestions...
  };

  const handleSearch = (question: string) => {
    saveCurrentToHistory(); // Save current before starting a new search
    setStaticAnswer(null); // Clear static so streaming takes over
    setDisplayedQuestion(question);
    // Ensure header is visible during loading (start)
    // Actually prompt triggers "Focus Mode"? No, loading triggers it?
    // Previous logic: "Ensure header is visible during loading".
    // "Hide Header on Success" -> `onFinish`.
    // Let's keep existing behavior.

    window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: false } }));

    submit({ question });
  };

  const handleExampleClick = (q: string) => {
    handleSearch(q);
  };

  const restoreHistoryItem = (item: HistoryItem) => {
    saveCurrentToHistory(); // Save current before switching
    stop(); // Stop any active stream
    setDisplayedQuestion(item.question);
    setStaticAnswer(item.answer);
    setShowHistory(false);
    window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: true } })); // Hide header for answer
  };

  const showContent = !!displayedQuestion && (isLoading || !!currentAnswer || !!error); // Keep content visible on error

  return (
    <div className="min-h-screen flex flex-col relative">

      {/* History Slide-over / Modal */}
      {showHistory && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/20 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowHistory(false)}>
          <div className="w-full max-w-md h-full bg-white shadow-2xl p-6 overflow-y-auto animate-in slide-in-from-right duration-300 pointer-events-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-serif text-stone-800">Inquiry History</h2>
              <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-stone-100 rounded-full text-stone-500 transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {history.length === 0 && (
                <p className="text-stone-400 italic text-center py-10">No recent inquiries.</p>
              )}
              {history.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => restoreHistoryItem(item)}
                  className="w-full text-left p-4 rounded-xl border border-stone-100 hover:border-amber-200 hover:bg-amber-50/30 transition-all group"
                >
                  <p className="font-medium text-stone-800 line-clamp-2 mb-2 group-hover:text-amber-800">{item.question}</p>
                  <div className="flex items-center text-xs text-stone-400">
                    <Clock className="w-3 h-3 mr-1" />
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Answer Display */}
      {showContent && (
        <div className="w-full max-w-3xl mx-auto flex flex-col mb-40 px-4 md:px-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {/* Top Controls - Show when answer is ready or streaming starts */}
          {(!isLoading || !!object) && (
            <div className="self-start mt-12 mb-8 flex items-center gap-3">
              <button
                onClick={resetState}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 text-stone-600 hover:text-stone-900 group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                <span className="text-sm font-medium">Home</span>
              </button>

              {history.length > 0 && (
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 text-stone-600 hover:text-stone-900"
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">History ({history.length})</span>
                </button>
              )}
            </div>
          )}

          <div className="text-left">
            {/* Pass partial answer. AnswerDisplay must be robust. */}
            <AnswerDisplay
              answer={currentAnswer as Answer} // Use the unified answer
              question={displayedQuestion}
              onQuestionClick={handleExampleClick}
            />
          </div>
        </div>
      )}

      {/* Hero / Landing (Only if NO content) */}
      {!showContent && (
        <main className={`flex-grow flex flex-col w-full max-w-3xl mx-auto px-4 md:px-6 pb-24 md:pb-40 transition-all duration-500 ease-in-out ${currentAnswer || isLoading ? 'pt-8 md:pt-12' : 'pt-24 md:pt-36'}`}>
          <div className="flex flex-col items-center text-center space-y-8 py-4">
            {/* History Button on Home if history exists */}
            {history.length > 0 && (
              <div className="relative mt-20 md:mt-0 md:absolute md:top-6 md:right-6 animate-in fade-in slide-in-from-top-4 duration-700">
                <button
                  onClick={() => setShowHistory(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/50 backdrop-blur-sm border border-stone-200 rounded-full shadow-sm hover:shadow-md transition-all text-stone-600"
                >
                  <Clock className="w-4 h-4" />
                  <span className="text-sm font-medium">Recents</span>
                </button>
              </div>
            )}

            {/* Hero - Only show completely if no interaction yet */}
            <div className="space-y-4 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700 mb-6 mt-12">
              <h1 className="font-serif text-4xl md:text-6xl font-medium tracking-tight text-stone-900 leading-[1.1]">
                Wisdom from the <br /> <span className="italic text-stone-800/80">Adi Kavya.</span>
              </h1>
              <p className="text-stone-500 text-sm md:text-base font-normal tracking-wide max-w-md mx-auto leading-relaxed">
                Explore the intricate dharma, characters, and verses of the Ramayana through a text-grounded lens.
              </p>
            </div>

            {/* Quick Prompts - Show if no answer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(s.text)}
                  className="text-left p-4 rounded-xl bg-white border border-stone-100 shadow-sm hover:shadow-md hover:border-amber-200/50 transition-all duration-300 group"
                >
                  <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1 block group-hover:text-amber-600 transition-colors">{s.category}</span>
                  <span className="font-serif text-stone-800 text-sm">{s.text}</span>
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="w-full max-w-xl bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm animate-in shake">
                {error instanceof Error ? error.message : String(error)}
              </div>
            )}
          </div>
        </main>
      )}

      {/* Loading Skeleton - Only show if loading AND no data yet (Skeleton disappears once stream starts) */}
      {isLoading && !object && (
        <div className="w-full text-left mb-20 animate-in fade-in duration-500">
          <AnswerSkeleton />
        </div>
      )}

      {/* Floating Input Fixed at Bottom */}
      <FloatingQuestionInput
        onSubmit={handleSearch}
        isLoading={isLoading}
      />

    </div>
  );
}
