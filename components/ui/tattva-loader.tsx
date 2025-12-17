import Image from "next/image";
import { cn } from "@/lib/utils";

interface TattvaLoaderProps {
    className?: string;
    size?: number; // size in px
}

export function TattvaLoader({ className, size = 48 }: TattvaLoaderProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center gap-4", className)}>
            <div className="relative animate-[spin_3s_linear_infinite]">
                <Image
                    src="/favicon.png"
                    alt="Loading..."
                    width={size}
                    height={size}
                    className="object-contain opacity-80"
                    priority
                />
            </div>
            {/* Optional: Add text if desired, or keep it minimal */}
            {/* <p className="font-serif text-stone-400 text-sm tracking-widest uppercase animate-pulse">Loading</p> */}
        </div>
    );
}
