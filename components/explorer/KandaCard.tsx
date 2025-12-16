import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface KandaCardProps {
    name: string;
    description: string;
    totalSargas: number;
    index: number;
    className?: string;
}

const ROMAN_NUMERALS = ["I", "II", "III", "IV", "V", "VI", "VII"];

type CardVariant = 'default' | 'featured' | 'dark';

export function KandaCard({ name, description, totalSargas, index, className = "" }: KandaCardProps) {

    // Determine variant based on Kanda name
    let variant: CardVariant = 'default';
    if (name.includes("Yuddha")) variant = 'dark';
    if (name.includes("Sundara")) variant = 'featured';

    const RomanNumeral = ROMAN_NUMERALS[index];

    // Badge logic
    const Badge = () => {
        if (index === 0) return <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-600 bg-amber-50 px-2 py-1 rounded">Beginning</span>;
        if (variant === 'dark') return <span className="text-[10px] font-semibold uppercase tracking-widest text-amber-400 bg-amber-900/30 px-2 py-1 rounded border border-amber-900/50">The Great War</span>;
        return null;
    };

    // Dynamic classes based on variant
    const containerClasses = {
        default: "bg-white border-stone-200/60 hover:bg-stone-50 hover:border-stone-300",
        featured: "bg-stone-50 border-stone-200/60 hover:bg-white hover:border-amber-200",
        dark: "bg-stone-900 border-stone-800 hover:border-stone-700"
    };

    const textClasses = {
        title: variant === 'dark' ? "text-stone-100 group-hover:text-white" : "text-stone-800 group-hover:text-amber-700",
        desc: variant === 'dark' ? "text-stone-400" : "text-stone-500",
        meta: variant === 'dark' ? "text-stone-500" : "text-stone-400",
        roman: variant === 'dark' ? "text-stone-100 mix-blend-overlay opacity-20" : variant === 'featured' ? "text-amber-900 opacity-10" : "text-stone-400 opacity-10"
    };

    return (
        <Link href={`/explorer/${name}`} className={`block group relative ${className}`}>
            <div className={`h-full rounded-xl border p-6 md:p-8 transition-all duration-500 cursor-pointer overflow-hidden flex flex-col justify-between relative ${containerClasses[variant]} group-hover:-translate-y-0.5 group-hover:shadow-medium`}>

                {/* Roman Numeral Background */}
                <div className={`absolute pointer-events-none transition-transform duration-700 group-hover:scale-110 ${variant === 'dark' ? 'top-0 right-0 p-8' : variant === 'featured' ? '-top-2 -right-2' : '-bottom-4 -right-4 rotate-12'}`}>
                    <span className={`font-serif leading-none select-none ${textClasses.roman} ${variant === 'featured' ? 'text-7xl' : 'text-8xl'}`}>
                        {RomanNumeral}
                    </span>
                </div>

                <div className="relative z-10 font-sans">
                    {/* Meta Header */}
                    <div className="flex items-center gap-3 mb-4">
                        <Badge />
                        <span className={`text-[10px] font-semibold uppercase tracking-widest ${textClasses.meta}`}>
                            {totalSargas} Sargas
                        </span>
                    </div>

                    <h3 className={`font-serif text-2xl md:text-3xl font-medium tracking-tight mb-3 transition-colors ${textClasses.title}`}>
                        {name}
                    </h3>

                    <p className={`font-serif italic text-sm md:text-base leading-relaxed max-w-md ${textClasses.desc}`}>
                        {description}
                    </p>
                </div>

                {/* Footer Action */}
                <div className="mt-8 flex items-center gap-2 text-stone-400 group-hover:text-stone-800 transition-colors text-xs font-medium">
                    <span>Explore verses</span>
                    <ArrowRight className="w-3 h-3" />
                </div>

            </div>
        </Link>
    );
}
