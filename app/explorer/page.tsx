import { getKandas } from "@/lib/data/ramayana";
import { KandaCard } from "@/components/explorer/KandaCard";
import { FloatingSearch } from "@/components/explorer/FloatingSearch";

export const metadata = {
    title: 'Ramayana Explorer | Tattva',
    description: 'Explore the Valmiki Ramayana by Kanda, Sarga, and Shloka.',
};

export default async function ExplorerPage() {
    const kandas = await getKandas();

    // specific mapping to match the HTML layout
    // Bala (0) -> col-span-2
    // Yuddha (5) -> col-span-2
    // Others -> col-span-1
    const getSpanClass = (index: number) => {
        if (index === 0 || index === 5) return "lg:col-span-2";
        return "md:col-span-1";
    };

    return (
        <div className="min-h-screen pb-24">
            <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-32">

                {/* Hero Header with Seal */}
                <div className="flex flex-col items-center text-center mb-16 relative space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <div className="space-y-3 max-w-2xl">
                        <h1 className="text-4xl md:text-6xl font-medium font-serif tracking-tight text-stone-900">
                            The Valmiki Ramayana
                        </h1>
                        <p className="text-xl text-stone-500 font-serif italic font-normal">
                            Journey Through the Adi Kavya
                        </p>

                        <div className="w-24 h-px bg-gradient-to-r from-transparent via-stone-300 to-transparent mx-auto my-6 opacity-60"></div>

                        <p className="text-lg text-stone-500 font-sans leading-relaxed max-w-lg mx-auto">
                            Immerse yourself in the eternal stream of Dharma. Traverse the seven Kandas of the Ramayana,
                            exploring the original Sanskrit verses alongside their word-for-word meanings and translations.
                            From the banks of the Sarayu to the shores of Lanka, follow the path of Sri Rama.
                        </p>
                    </div>
                </div>

                {/* Asymmetrical Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-100">
                    {kandas.map((kanda, index) => (
                        <KandaCard
                            key={kanda.name}
                            index={index}
                            name={kanda.name}
                            description={kanda.description}
                            totalSargas={kanda.totalSargas}
                            className={getSpanClass(index)}
                        />
                    ))}
                </div>

                {/* Footer Seal */}
                <div className="mt-20 text-center">
                    <div className="inline-flex items-center gap-4 text-[10px] uppercase tracking-[0.3em] text-stone-400 font-medium">
                        <span className="w-8 h-px bg-stone-300"></span>
                        || Sri Rama Jayam ||
                        <span className="w-8 h-px bg-stone-300"></span>
                    </div>
                </div>

            </div>

            {/* Sticky Footer Search */}
            <FloatingSearch />
        </div>
    );
}
