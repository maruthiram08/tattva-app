import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
    return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4 text-stone-500">
                <Spinner className="size-8 text-amber-600/80" />
                <p className="font-serif italic text-lg animate-pulse">Loading...</p>
            </div>
        </div>
    );
}
