'use client';

import { useEffect } from 'react';

export function ScrollToHash() {
    useEffect(() => {
        // Handle initial hash scroll
        const hash = window.location.hash;
        if (hash) {
            // Small timeout to allow layout stability
            setTimeout(() => {
                const element = document.querySelector(hash);
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    // Also add a highlight effect temporarily?
                    element.classList.add('bg-amber-50/50');
                    setTimeout(() => element.classList.remove('bg-amber-50/50'), 2000);
                }
            }, 500);
        }
    }, []);

    return null;
}
