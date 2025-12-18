
import { ChevronLeft } from 'lucide-react';

export default function Loading() {
    return (
        <div className="space-y-8 max-w-3xl mx-auto px-4 md:px-0">
            {/* Header Skeleton */}
            <div className="text-center border-b pb-8 animate-pulse">
                <div className="flex justify-start mb-6">
                    <div className="h-9 w-32 bg-stone-200 rounded-full"></div>
                </div>
                <div className="h-4 w-24 bg-stone-200 mx-auto mb-2 rounded"></div>
                <div className="h-10 w-48 bg-stone-200 mx-auto rounded mb-4"></div>
                <div className="h-4 w-64 bg-stone-200 mx-auto rounded"></div>
                <div className="h-3 w-16 bg-stone-200 mx-auto mt-2 rounded"></div>
            </div>

            {/* Shloka Skeletons */}
            <div className="space-y-6">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="p-6 rounded-lg border border-stone-100 bg-stone-50/50 space-y-4 animate-pulse">
                        <div className="flex justify-between">
                            <div className="h-6 w-8 bg-stone-200 rounded"></div>
                            <div className="h-6 w-24 bg-stone-200 rounded"></div>
                        </div>
                        {/* Sanskrit-ish blocks */}
                        <div className="space-y-2 py-2">
                            <div className="h-6 w-3/4 mx-auto bg-stone-200 rounded opacity-60"></div>
                            <div className="h-6 w-2/3 mx-auto bg-stone-200 rounded opacity-60"></div>
                        </div>
                        {/* Translation blocks */}
                        <div className="space-y-2 pt-2">
                            <div className="h-4 w-full bg-stone-200 rounded"></div>
                            <div className="h-4 w-5/6 bg-stone-200 rounded"></div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
