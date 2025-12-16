import { getSargas } from "@/lib/data/ramayana";
import { SargaGrid } from "@/components/explorer/SargaGrid";
import { notFound } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";

export async function generateMetadata({ params }: { params: { kanda: string } }) {
    const kandaName = decodeURIComponent(params.kanda);
    return {
        title: `${kandaName} | Ramayana Explorer`,
    };
}

export default async function KandaPage({ params }: { params: { kanda: string } }) {
    const kandaName = decodeURIComponent(params.kanda);
    const sargas = await getSargas(kandaName);

    if (!sargas || sargas.length === 0) {
        notFound();
    }

    return (
        <div className="space-y-8">
            <div className="border-b pb-6">
                <Link
                    href="/explorer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-full shadow-sm hover:shadow-md transition-all duration-300 text-stone-600 hover:text-stone-900 mb-8 group"
                >
                    <ChevronLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                    <span className="text-sm font-medium">Explorer</span>
                </Link>
                <h1 className="text-3xl font-bold font-serif mb-2">{kandaName}</h1>
                <p className="text-muted-foreground">Select a Sarga (Chapter) to read.</p>
            </div>

            <SargaGrid kandaName={kandaName} sargas={sargas} />
        </div>
    );
}
