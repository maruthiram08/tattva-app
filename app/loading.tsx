import Image from "next/image";

export default function Loading() {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
            <div className="animate-spin duration-1000">
                <Image
                    src="/favicon.png"
                    alt="Loading..."
                    width={48}
                    height={48}
                    className="w-12 h-12 opacity-90"
                    priority
                />
            </div>
        </div>
    );
}
