"use client";

import React, { useRef, useEffect, useTransition, useCallback } from 'react';
import { Search, Plus, Loader2, X } from 'lucide-react';
import { Button, Input } from '@/components/common';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';

const SEARCH_DEBOUNCE_MS = 400;

interface FinancialYearTableToolbarProps {
  onAdd?: (() => void) | undefined;
}

export const FinancialYearTableToolbar: React.FC<FinancialYearTableToolbarProps> = ({ onAdd }) => {
  const t = useTranslations('financialYear');
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchIdRef = useRef(0);

  const currentSearch = searchParams.get('search') || '';
  useEffect(() => {
    if (inputRef.current && inputRef.current.value !== currentSearch) {
      inputRef.current.value = currentSearch;
    }
  }, [currentSearch]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const navigateWithParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(window.location.search);
    Object.entries(updates).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
    params.set('page', '1');
    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    });
  }, [pathname, router]);

  const handleSearch = useCallback((term: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    const currentSearchId = ++searchIdRef.current;
    timeoutRef.current = setTimeout(() => {
      if (currentSearchId !== searchIdRef.current) return;
      const cleanTerm = term.replace(/[^\p{L}\p{M}\p{N}\s\-]/gu, "");
      navigateWithParams({ search: cleanTerm || null });
    }, SEARCH_DEBOUNCE_MS);
  }, [navigateWithParams]);

  const handleClearSearch = useCallback(() => {
    if (inputRef.current) inputRef.current.value = '';
    navigateWithParams({ search: null });
  }, [navigateWithParams]);

  return (
    <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/80 rounded-t-xl">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="relative w-full md:w-72 group">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none z-10">
            {isPending ? (
              <Loader2 className="w-4 h-4 text-violet-500 animate-spin" />
            ) : (
              <Search className="w-4 h-4 text-slate-400 group-focus-within:text-violet-500 transition-colors" />
            )}
          </div>
          <Input 
            ref={inputRef}
            placeholder={t('table.searchPlaceholder')} 
            className={cn(
              "pl-9 pr-8 bg-white border-slate-200 focus:ring-2 focus:ring-violet-500/20 transition-all cursor-text shadow-sm",
              isPending && "opacity-70"
            )}
            onChange={(e) => handleSearch(e.target.value)}
            defaultValue={currentSearch}
            aria-label={t('table.searchPlaceholder')}
          />
          {currentSearch && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-400 hover:text-slate-600 transition-colors"
              aria-label="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
      {onAdd && (
        <Button 
          onClick={onAdd} 
          icon={Plus}
          className="flex items-center bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 transition-all transform active:scale-95 cursor-pointer font-bold px-5"
        >
          {t('table.addButton')}
        </Button>
      )}
    </div>
  );
};
