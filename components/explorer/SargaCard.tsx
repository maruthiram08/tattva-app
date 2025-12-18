import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";

interface SargaCardProps {
    kandaName: string;
    sargaNum: number;
    title: string | null;
    shlokaCount: number;
}

export function SargaCard({ kandaName, sargaNum, title, shlokaCount }: SargaCardProps) {
    const href = `/explorer/${encodeURIComponent(kandaName)}/${sargaNum}`;

    return (
        <Link href={href} className="flex flex-col h-full">
            <Card className="hover:bg-accent/50 transition-colors text-center border h-full flex flex-col justify-start">
                <CardContent className="p-6 flex flex-col items-center h-full">
                    <span className="text-xs md:text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                        Sarga {sargaNum}
                    </span>

                    {title ? (
                        <h3 className="text-lg md:text-xl font-serif text-primary mb-3 leading-tight">
                            {title}
                        </h3>
                    ) : (
                        <p className="text-sm italic text-muted-foreground">No description available</p>
                    )}

                    <div className="mt-auto pt-4">
                        <span className="text-[10px] md:text-xs text-stone-500 font-medium bg-stone-100 px-2 py-1 rounded-full">
                            {shlokaCount} Shlokas
                        </span>
                    </div>
                </CardContent>
            </Card>
        </Link>
    );
}
