'use client';

import { experimental_useObject as useObject } from '@ai-sdk/react';
import { z } from 'zod';
import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, Clock, X, ArrowRight } from 'lucide-react';
import { Answer } from '@/lib/types/templates';
import { FloatingQuestionInput } from '@/components/question/FloatingQuestionInput';
import { DailyWisdom } from '@/components/home/DailyWisdom';
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
  const [retrievalData, setRetrievalData] = useState<any>(undefined); // Typing as any to avoid import circles for now, or import RetrievalResult

  const [isRetrieving, setIsRetrieving] = useState(false);

  // Track if we're in content mode to prevent header hide on home return
  const isInContentMode = useRef(false);

  // Initialize Streaming Hook
  const { object, submit, isLoading, error, stop } = useObject({
    api: '/api/answer',
    schema: AnswerSchema,
    onFinish: ({ object }) => {
      // Only hide header if we're actually in content mode
      if (object && isInContentMode.current) {
        window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: true } }));
      } else if (!object) {
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
  // If retrieving, force null to hide stale content
  const currentAnswer = isRetrieving ? null : (isLoading ? streamingAnswer : (staticAnswer || streamingAnswer));

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

  // Load history from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('tattva-history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setHistory(parsed);
      } catch (e) {
        console.error('Failed to parse history:', e);
      }
    }
  }, []);

  // Notify Navigation component when history changes
  useEffect(() => {
    window.dispatchEvent(new CustomEvent('history-updated', {
      detail: { hasHistory: history.length > 0 }
    }));
  }, [history]);

  // Listen for show-history event from Navigation
  useEffect(() => {
    const handleShowHistory = () => setShowHistory(true);
    window.addEventListener('show-history', handleShowHistory);
    return () => window.removeEventListener('show-history', handleShowHistory);
  }, []);

  // Manage Focus Mode (Header Visibility)
  useEffect(() => {
    // Hide header if we have an answer OR if we are currently loading (Focus Mode)
    if (!!currentAnswer || isLoading || isRetrieving) {
      window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: true } }));
    } else {
      window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: false } }));
    }
  }, [currentAnswer, isLoading, isRetrieving]);

  const saveCurrentToHistory = () => {
    if (currentAnswer && displayedQuestion && !isLoading && !isRetrieving) {
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
    setRetrievalData(undefined); // Clear retrieval
    setDisplayedQuestion('');
    isInContentMode.current = false; // Exit content mode
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Show Header - use setTimeout to ensure this fires AFTER any onFinish callbacks
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: false } }));
    }, 0);
  };

  const handleSearch = async (question: string) => {
    saveCurrentToHistory(); // Save current before starting a new search
    setStaticAnswer(null); // Clear static so streaming takes over
    setRetrievalData(undefined);
    setDisplayedQuestion(question);
    isInContentMode.current = true; // Enter content mode

    // Ensure header is visible during loading (start)
    window.dispatchEvent(new CustomEvent('toggle-focus-mode', { detail: { hidden: false } }));

    try {
      setIsRetrieving(true);
      // Step 1: Specific Retrieval
      const retrieveRes = await fetch('/api/retrieve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question })
      });

      if (!retrieveRes.ok) throw new Error("Retrieval failed");

      const data = await retrieveRes.json();
      const retrieval = data.retrieval;

      console.log("Retrieval completed:", retrieval);
      setRetrievalData(retrieval);

      // Step 2: Generate Answer
      submit({ question, retrieval });
    } catch (e) {
      console.error("Search flow failed:", e);
      setIsRetrieving(false);
    } finally {
      setIsRetrieving(false);
    }
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
    isInContentMode.current = true; // Enter content mode
    // Don't hide header - let the content wrapper handle visibility
  };

  // Show content mode whenever we have a question - prevents layout flicker
  const showContent = !!displayedQuestion;

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
          {/* Top Controls - Hide during initial loading to prevent visual clutter */}
          <div className={`self-start mt-12 mb-8 flex items-center gap-3 transition-opacity duration-300 ${!currentAnswer ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <button
              onClick={resetState}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 text-stone-600 hover:text-stone-900 group"
            >
              <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-sm font-medium">Home</span>
            </button>

            {false && history.length > 0 && (
              <button
                onClick={() => setShowHistory(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 text-stone-600 hover:text-stone-900"
              >
                <Clock className="w-4 h-4" />
                <span className="text-sm font-medium">Recents</span>
              </button>
            )}
          </div>

          <div className="text-left">
            {/* Error Message - Show here if content mode is active */}
            {error && (
              <div className="w-full mb-8 bg-red-50 border border-red-100 text-red-600 p-4 rounded-xl text-sm animate-in shake">
                {error instanceof Error ? error.message : String(error)}
              </div>
            )}

            {/* Pass partial answer. AnswerDisplay must be robust. */}
            <AnswerDisplay
              answer={currentAnswer as Answer} // Use the unified answer
              question={displayedQuestion}
              retrieval={retrievalData}
              onQuestionClick={handleExampleClick}
            />
          </div>
        </div>
      )}

      {/* Hero / Landing (Only if NO content) */}
      {!showContent && (
        <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto px-4 md:px-6 pb-24 md:pb-40 pt-24 md:pt-36 transition-all duration-500 ease-in-out">
          <div className="flex flex-col items-center text-center py-4">
            {/* Hero - Only show completely if no interaction yet */}
            <div className="space-y-4 max-w-xl animate-in fade-in slide-in-from-bottom-4 duration-700 mb-6">
              <h1 className="font-serif text-4xl md:text-6xl font-medium tracking-tight text-stone-900 leading-[1.1]">
                Wisdom from the <br /> <span className="italic text-stone-800/80">Adi Kavya.</span>
              </h1>
              <p className="text-stone-500 text-sm md:text-base font-normal tracking-wide max-w-md mx-auto leading-relaxed">
                Explore the 24,000 verses of Valmiki&apos;s Ramayana. Ask about characters, dharma, or specific shlokas.
              </p>
            </div>

            {/* Centered Search Bar with Glow */}
            <div className="w-full max-w-4xl mx-auto mt-12 mb-8">
              <FloatingQuestionInput
                variant="inline"
                onSubmit={handleSearch}
                isLoading={isLoading}
              />
            </div>

            {/* Guiding Text */}
            <div className="w-full max-w-xl text-left animate-in fade-in slide-in-from-bottom-6 duration-700 delay-75 mt-12 mb-6">
              <p className="text-xs font-semibold text-stone-600 uppercase tracking-widest pl-1">
                Don&apos;t Know What to Ask? Try our Curated Threads
              </p>
            </div>

            {/* Quick Prompts - Show if no answer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
              {suggestions.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExampleClick(s.text)}
                  className="text-left p-4 rounded-xl bg-white border border-stone-100 shadow-sm hover:shadow-lg hover:border-stone-300 hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <span className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1 block group-hover:text-amber-600 transition-colors">{s.category}</span>
                      <span className="font-serif text-stone-800 text-sm">{s.text}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-300 group-hover:text-amber-600 group-hover:translate-x-1 transition-all flex-shrink-0 mt-0.5" />
                  </div>
                </button>
              ))}
            </div>

            {/* Daily Wisdom Widget - Moved below curated threads */}
            <DailyWisdom />

            {/* Footer Seal */}
            <div className="mt-20 text-center">
              <div className="inline-flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-stone-400 font-medium">
                <span className="w-8 h-px bg-stone-300"></span>
                || Sri Rama Jayam ||
                <span className="w-8 h-px bg-stone-300"></span>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Loading Skeleton - Show when in content mode and no answer yet */}
      {showContent && !currentAnswer && (
        <div className="w-full text-left mb-20 animate-in fade-in duration-500">
          <AnswerSkeleton />
        </div>
      )}


      {/* Floating Input Fixed at Bottom - Only show on answer page */}
      {showContent && (
        <FloatingQuestionInput
          onSubmit={handleSearch}
          isLoading={isLoading || isRetrieving}
        />
      )}

    </div>
  );
}
