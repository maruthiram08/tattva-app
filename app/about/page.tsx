import { BookOpen, Search, Zap } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-grow flex flex-col w-full max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div className="max-w-xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

          <div className="text-center mb-10">
            <h2 className="font-serif text-3xl text-stone-900 mb-2">About Tattva</h2>
            <div className="h-1 w-12 bg-amber-400 mx-auto rounded-full"></div>
          </div>

          <div className="bg-white p-8 rounded-3xl shadow-soft border border-stone-100 space-y-6">
            <div>
              <h3 className="font-sans font-semibold text-xs text-amber-600 uppercase tracking-widest mb-3">Our Mission</h3>
              <p className="font-serif text-lg leading-relaxed text-stone-700">
                Tattva serves as a digital gateway to the <strong>Adi Kavya</strong>, harmonizing the ancient wisdom of the Valmiki Ramayana with modern inquiry. We empower seekers to navigate the epic&apos;s profound verses with scholarly rigor and intuition.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 hover:border-amber-200/50 transition-colors">
                <Search className="w-5 h-5 text-stone-800 mb-2" />
                <span className="block text-sm font-medium text-stone-900">Semantic Discovery</span>
                <span className="text-xs text-stone-500 leading-snug">Traverse 24,000 verses by concept or meaning.</span>
              </div>
              <div className="p-4 bg-stone-50 rounded-xl border border-stone-100 hover:border-amber-200/50 transition-colors">
                <Zap className="w-5 h-5 text-stone-800 mb-2" />
                <span className="block text-sm font-medium text-stone-900">Dharmic Nuance</span>
                <span className="text-xs text-stone-500 leading-snug">Unravel the subtle motivations behind every action.</span>
              </div>
            </div>

            <div>
              <h3 className="font-sans font-semibold text-xs text-amber-600 uppercase tracking-widest mb-3">The Source of Truth</h3>
              <p className="text-sm leading-relaxed text-stone-600">
                Tattva&apos;s answers are generated based *only* on the critical edition of Valmiki&apos;s Ramayana. Whatever is not in the text features in the &quot;Interpretive&quot; or &quot;Tradition&quot; section, clearly marked. &quot;Let&apos;s stick to the text&quot; is our motto.
              </p>
            </div>

            <div className="border-t border-stone-100 pt-6 mt-6">
              <h3 className="font-sans font-semibold text-xs text-stone-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Sources & Credits</span>
              </h3>
              <p className="text-xs text-stone-500 mb-4 leading-relaxed">
                This dataset was compiled from verified Sanskrit corpora and structured for better usability, referencing key translations and academic sources.
              </p>
              <ul className="space-y-2 text-xs text-stone-500">
                <li className="flex items-start gap-2">
                  <span className="text-amber-500/50">•</span>
                  <span>
                    <strong className="font-medium text-stone-600">M.N. Dutt&apos;s English Translation (1891-1894)</strong>
                    <a href="https://archive.org" target="_blank" rel="noopener noreferrer" className="ml-1 text-stone-400 hover:text-amber-600 underline decoration-stone-200 hover:decoration-amber-300 transition-all">Archive.org</a>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500/50">•</span>
                  <span>
                    <strong className="font-medium text-stone-600">IIT Kanpur Gita Supersite</strong>
                    <a href="https://www.valmiki.iitk.ac.in/" target="_blank" rel="noopener noreferrer" className="ml-1 text-stone-400 hover:text-amber-600 underline decoration-stone-200 hover:decoration-amber-300 transition-all">IIT-Kanpur</a>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-500/50">•</span>
                  <span>
                    <strong className="font-medium text-stone-600">Gyaandweep</strong>
                    <a href="https://www.gyaandweep.com" target="_blank" rel="noopener noreferrer" className="ml-1 text-stone-400 hover:text-amber-600 underline decoration-stone-200 hover:decoration-amber-300 transition-all">Gyaandweep.com</a>
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <p className="text-[10px] font-sans text-stone-400 uppercase tracking-widest">
              Designed with Shradha & Satya
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
