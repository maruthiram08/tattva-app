import { Shloka } from "@/lib/data/ramayana";

interface ShlokaViewProps {
    shloka: Shloka;
}

export function ShlokaView({ shloka }: ShlokaViewProps) {
    return (
        <div className="py-8 border-b last:border-0 scroll-m-20" id={`shloka-${shloka.shloka}`}>
            <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-mono text-muted-foreground bg-muted px-2 py-1 rounded">
                    {shloka.kanda} {shloka.sarga}.{shloka.shloka}
                </span>
            </div>

            <div className="space-y-6">
                {/* Sanskrit Text */}
                <p className="text-xl md:text-2xl font-serif text-center leading-loose text-foreground font-medium">
                    {shloka.shloka_text}
                </p>

                {/* Transliteration */}
                {shloka.transliteration && (
                    <p className="text-md text-center text-muted-foreground italic font-mono">
                        {shloka.transliteration}
                    </p>
                )}

                {/* Explanation / Comments */}
                {(shloka.explanation || shloka.comments) && (
                    <div className="text-base text-muted-foreground/80 space-y-2">
                        {shloka.explanation && <p>{shloka.explanation}</p>}
                        {shloka.comments && <p className="text-sm italic border-l-2 pl-4 border-primary/30">{shloka.comments}</p>}
                    </div>
                )}

                {/* Translation */}
                <div className="bg-muted/30 p-4 rounded-lg">
                    <h4 className="text-sm font-semibold mb-2 uppercase tracking-wider text-muted-foreground">Meaning</h4>
                    <div className="space-y-2">
                        {shloka.translation ? (
                            shloka.translation.split(',').map((item, index) => {
                                const trimmed = item.trim();
                                if (!trimmed) return null;
                                return (
                                    <p key={index} className="text-lg text-foreground/90 leading-relaxed">
                                        {trimmed}
                                    </p>
                                );
                            })
                        ) : (
                            <p className="text-lg text-foreground/90 leading-relaxed">
                                No translation available.
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
