'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChevronRight, Home } from "lucide-react";
import { Fragment } from 'react';

export function ExplorerBreadcrumbs() {
    const pathname = usePathname();

    if (!pathname.startsWith('/explorer')) return null;

    const segments = pathname.split('/').filter(Boolean);
    // segments[0] is 'explorer', [1] is kanda, [2] is sarga

    const breadcrumbs = [
        { label: 'Explorer', href: '/explorer' }
    ];

    if (segments[1]) {
        const kanda = decodeURIComponent(segments[1]);
        breadcrumbs.push({ label: kanda, href: `/explorer/${segments[1]}` });
    }

    if (segments[2]) {
        const sarga = segments[2];
        breadcrumbs.push({ label: `Sarga ${sarga}`, href: `/explorer/${segments[1]}/${sarga}` });
    }

    return (
        <nav className="flex items-center text-sm text-muted-foreground mb-6 overflow-x-auto whitespace-nowrap">
            <Link href="/" className="hover:text-primary transition-colors mr-2">
                <Home className="w-4 h-4" />
            </Link>

            {breadcrumbs.map((crumb, index) => {
                const isLast = index === breadcrumbs.length - 1;
                return (
                    <Fragment key={crumb.href}>
                        <ChevronRight className="w-4 h-4 mx-1 flex-shrink-0" />
                        {isLast ? (
                            <span className="font-medium text-foreground">{crumb.label}</span>
                        ) : (
                            <Link href={crumb.href} className="hover:text-primary transition-colors">
                                {crumb.label}
                            </Link>
                        )}
                    </Fragment>
                );
            })}
        </nav>
    );
}
