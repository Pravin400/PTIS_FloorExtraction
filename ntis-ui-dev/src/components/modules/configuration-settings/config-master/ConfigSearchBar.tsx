'use client';

import { useTransition, useRef, useEffect } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/common';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils/cn';

/** Debounce delay for search input in milliseconds */
const SEARCH_DEBOUNCE_MS = 400;

export function ConfigSearchBar() {
  const t = useTranslations('configMaster');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIdRef = useRef(0); // Track search requests to prevent race conditions

  const currentSearch = searchParams.get('search') || '';

  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== currentSearch) {
      inputRef.current.value = currentSearch;
    }
  }, [currentSearch]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleSearch = (term: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Increment search ID for this request
    const currentSearchId = ++searchIdRef.current;
    
    timeoutRef.current = setTimeout(() => {
      startTransition(() => {
        // Verify this is still the latest search request
        if (currentSearchId !== searchIdRef.current) {
          return; // Stale search, ignore
        }
        
        // Use latest searchParams value instead of captured closure value
        const currentSearchParams = new URLSearchParams(window.location.search);
        if (term && term.length >= 2) {
          currentSearchParams.set('search', term);
        } else {
          currentSearchParams.delete('search');
        }
        router.push(`${pathname}?${currentSearchParams.toString()}`, { scroll: false });
      });
    }, SEARCH_DEBOUNCE_MS);
  };

  return (
    <div className="relative flex-1 group w-full">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none z-10">
        {isPending ? (
          <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
        ) : (
          <Search className="w-4 h-4 text-slate-500 group-focus-within:text-indigo-600 transition-all group-focus-within:scale-110" />
        )}
      </div>
      <Input
        ref={inputRef}
        placeholder={t('searchPlaceholder')}
        defaultValue={currentSearch}
        onChange={(e) => handleSearch(e.target.value)}
        className={cn(
          "pl-11 pr-10 h-11 bg-white border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 shadow-sm hover:shadow-md rounded-xl w-full text-slate-900 placeholder:text-slate-500 transition-all text-sm font-medium",
          isPending && "opacity-70"
        )}
      />
      {/* Clear button removed per user request */}
    </div>
  );
}
