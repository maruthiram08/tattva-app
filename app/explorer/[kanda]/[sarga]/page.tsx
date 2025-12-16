import { getShlokas, getSargas } from "@/lib/data/ramayana";
import { ShlokaView } from "@/components/explorer/ShlokaView";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronLeft } from "lucide-react";

interface Props {
    params: {
        kanda: string;
        sarga: string;
    };
}

export async function generateMetadata({ params }: Props) {
    const kandaName = decodeURIComponent(params.kanda);
    return {
        title: `Sarga ${params.sarga} | ${kandaName}`,
    };
}

export default async function SargaPage({ params }: Props) {
    const kandaName = decodeURIComponent(params.kanda);
    const sargaNum = parseInt(params.sarga, 10);

    const shlokas = await getShlokas(kandaName, sargaNum);

    if (!shlokas || shlokas.length === 0) {
        notFound();
    }

    // Fetch sarga info to get the proper title/summary
    const sargas = await getSargas(kandaName);
    const currentSargaInfo = sargas.find(s => s.sargaNum === sargaNum);

    // Use the title from the JSON dataset as the summary
    const summary = currentSargaInfo?.title;

    // Simple next/prev navigation logic could be added here if we knew max sargas easily 
    // without fetching everything. For now, we'll just show the list.

    return (
        <div className="space-y-8 max-w-3xl mx-auto px-4 md:px-0">
            <div className="text-center border-b pb-8">
                <div className="flex justify-start mb-6">
                    <Link
                        href={`/explorer/${params.kanda}`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 text-stone-600 hover:text-stone-900 group"
                    >
                        <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        <span className="text-sm font-medium">{kandaName}</span>
                    </Link>
                </div>
                <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-2">{kandaName}</h2>
                <h1 className="text-4xl font-bold font-serif">Sarga {sargaNum}</h1>
                {summary && (
                    <p className="mt-4 text-base italic text-muted-foreground/80 max-w-xl mx-auto">
                        {summary}
                    </p>
                )}
                <p className="mt-2 text-xs text-muted-foreground">{shlokas.length} Shlokas</p>
            </div>

            <div className="space-y-2">
                {shlokas.map((shloka) => (
                    <ShlokaView key={shloka.shloka} shloka={shloka} />
                ))}
            </div>

            <div className="flex justify-between pt-8 border-t">
                <Button variant="ghost" asChild>
                    <Link href={`/explorer/${params.kanda}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to {kandaName}
                    </Link>
                </Button>
            </div>
        </div>
    );
}
