import { TattvaLoader } from "@/components/ui/tattva-loader";

export default function Loading() {
    return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <TattvaLoader size={64} />
        </div>
    );
}
