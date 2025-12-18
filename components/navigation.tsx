'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export function Navigation() {
  const pathname = usePathname();
  const [isHidden, setIsHidden] = useState(false);
  const [hasHistory, setHasHistory] = useState(false);

  useEffect(() => {
    const handleToggle = (e: Event) => {
      const customEvent = e as CustomEvent<{ hidden: boolean }>;
      setIsHidden(customEvent.detail.hidden);
    };

    const handleHistoryUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{ hasHistory: boolean }>;
      setHasHistory(customEvent.detail.hasHistory);
    };

    window.addEventListener('toggle-focus-mode', handleToggle);
    window.addEventListener('history-updated', handleHistoryUpdate);
    return () => {
      window.removeEventListener('toggle-focus-mode', handleToggle);
      window.removeEventListener('history-updated', handleHistoryUpdate);
    };
  }, []);

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  const getButtonClass = (path: string) => {
    const base = 'px-3 py-1.5 md:px-4 text-xs md:text-sm font-medium rounded-full transition-all duration-300';
    if (isActive(path)) {
      // Black glassmorphism active state
      return `${base} bg-stone-900/90 backdrop-blur-sm text-stone-50 font-medium shadow-lg shadow-stone-900/20 border border-stone-700/50`;
    }
    return `${base} text-stone-500 hover:text-stone-900 hover:bg-stone-100/50`;
  };

  const handleHomeClick = () => {
    if (pathname === '/') {
      window.dispatchEvent(new Event('reset-home'));
    }
  };

  const handleRecentsClick = () => {
    window.dispatchEvent(new Event('show-history'));
  };

  // Hide header on Explorer subpages (Kanda/Sarga views)
  const isExplorerSubpage = pathname.startsWith('/explorer/') && pathname.split('/').length > 2;

  if (isExplorerSubpage) return null;

  return (
    <nav className={`absolute top-6 left-1/2 -translate-x-1/2 z-50 w-fit max-w-[95vw] transition-all duration-500 ease-in-out ${isHidden ? 'opacity-0 -translate-y-full pointer-events-none' : 'opacity-100 translate-y-0'}`}>
      <div className="bg-white/90 backdrop-blur-md rounded-full shadow-2xl border border-white/20 ring-1 ring-stone-900/5 px-2 py-1.5 md:px-2 md:py-2 flex items-center justify-between pl-4 pr-6 md:pl-6 md:pr-6 transition-all duration-300 hover:shadow-xl min-w-[340px] md:min-w-0">

        {/* Brand Logo */}
        <Link
          href="/"
          onClick={handleHomeClick}
          className="opacity-90 hover:opacity-100 transition-opacity flex-shrink-0 mr-2 md:mr-4"
        >
          {/* Mobile Logo (Icon Only) */}
          <Image
            src="/favicon.png"
            alt="Tattva"
            width={32}
            height={32}
            className="object-contain h-9 w-auto block md:hidden"
            priority
          />
          {/* Desktop Logo (Full Text) */}
          <Image
            src="/logo.png"
            alt="Tattva"
            width={100}
            height={36}
            className="object-contain h-9 w-auto hidden md:block"
            priority
          />
        </Link>

        {/* Navigation Tabs - Centered */}
        <div className="flex items-center gap-2 md:gap-2">
          <Link
            href="/"
            onClick={handleHomeClick}
            className={getButtonClass('/')}
          >
            Home
          </Link>
          <Link
            href="/explorer"
            className={getButtonClass('/explorer')}
          >
            Explorer
          </Link>
          <Link
            href="/about"
            className={getButtonClass('/about')}
          >
            About
          </Link>
        </div>

        {/* Recents Button - Only show if history exists */}
        {false && hasHistory && pathname === '/' && (
          <button
            onClick={handleRecentsClick}
            className="ml-2 md:ml-3 flex items-center gap-1.5 px-3 py-1.5 text-xs md:text-sm font-medium rounded-full transition-all duration-300 text-stone-500 hover:text-stone-900 hover:bg-stone-100/50"
          >
            <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden md:inline">Recents</span>
          </button>
        )}
      </div>
    </nav>
  );
}
