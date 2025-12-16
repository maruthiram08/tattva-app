import Link from 'next/link';
import { Compass, ChevronRight } from 'lucide-react';

export function RefusalCard() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center max-w-lg mx-auto">

      <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-stone-100 to-stone-200 flex items-center justify-center text-stone-400 mb-6 shadow-sm border border-white">
        <Compass className="h-8 w-8" />
      </div>

      <h2 className="font-serif text-3xl font-medium text-stone-900 mb-4">
        Beyond the Text
      </h2>

      <p className="text-stone-500 leading-relaxed mb-8">
        This inquiry falls outside the scope of Valmiki&apos;s Ramayana. Tattva is strictly a text-grounded interpreter and does not engage in cross-religious comparison or modern political commentary.
      </p>

      <div className="w-full bg-white rounded-xl shadow-soft border border-stone-100 p-1">
        <div className="px-4 py-3 border-b border-stone-50 text-left">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-400">Try asking this instead</span>
        </div>
        <div>
          <button className="w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors flex items-center justify-between group">
            <span className="text-sm font-serif text-stone-700">How is Dharma defined in Ayodhya Kanda?</span>
            <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-500 transition-colors" />
          </button>
          <div className="h-px bg-stone-50 w-full"></div>
          <button className="w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors flex items-center justify-between group">
            <span className="text-sm font-serif text-stone-700">What arguments did Bharata use?</span>
            <ChevronRight className="w-4 h-4 text-stone-300 group-hover:text-amber-500 transition-colors" />
          </button>
        </div>
      </div>

      <Link href="/" className="mt-8 text-xs font-semibold uppercase tracking-wider text-stone-400 hover:text-stone-900 transition-colors">
        Return Home
      </Link>

    </div>
  );
}
