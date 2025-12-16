import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export function SearchPlaceholder() {
    return (
        <div className="relative w-full max-w-sm">
            <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search Shlokas..."
                    className="pl-8 bg-muted/20 cursor-not-allowed opacity-70"
                    disabled
                />
            </div>
            <div className="absolute -top-3 -right-2 text-[10px] px-1.5 h-5 flex items-center justify-center rounded-full bg-secondary text-secondary-foreground pointer-events-none font-semibold">
                Coming Soon
            </div>
        </div>
    );
}
