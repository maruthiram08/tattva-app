import Link from 'next/link';
import { Card, CardContent } from "@/components/ui/card";

interface SargaCardProps {
    kandaName: string;
    sargaNum: number;
    title: string | null;
}

export function SargaCard({ kandaName, sargaNum, title }: SargaCardProps) {
    const href = `/explorer/${encodeURIComponent(kandaName)}/${sargaNum}`;

    return (
        <Link href={href} className="flex flex-col h-full">
            <Card className="hover:bg-accent/50 transition-colors text-center border h-full flex flex-col justify-start">
                <CardContent className="p-6 flex flex-col items-center">
                    <span className="text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">Sarga {sargaNum}</span>

                    {title ? (
                        <h3 className="text-xl font-serif text-primary mb-3 leading-tight">
                            {title}
                        </h3>
                    ) : (
                        <p className="text-sm italic text-muted-foreground">No description available</p>
                    )}
                </CardContent>
            </Card>
        </Link>
    );
}
