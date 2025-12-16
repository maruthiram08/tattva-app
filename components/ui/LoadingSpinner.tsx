import Image from "next/image";

export function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center p-4">
            <div className="relative w-12 h-12 animate-[spin_3s_linear_infinite]">
                <Image
                    src="/logo.png"
                    alt="Loading..."
                    fill
                    className="object-contain opacity-80"
                    priority
                />
            </div>
        </div>
    );
}
