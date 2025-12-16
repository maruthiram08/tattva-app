export default function ExplorerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="container max-w-5xl mx-auto py-8 px-4 md:px-6">
            {children}
        </div>
    );
}
