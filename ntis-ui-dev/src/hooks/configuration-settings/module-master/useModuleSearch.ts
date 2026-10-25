'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { TransitionStartFunction } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TEXT_SANITIZE } from '@/lib/utils/validation';

interface UseModuleSearchProps {
  locale: string;
  startTransition: TransitionStartFunction;
}

export function useModuleSearch({ locale, startTransition }: UseModuleSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearchTerm = searchParams.get('search') || '';

  const [search, setSearch] = useState(currentSearchTerm);
  const isFirstRender = useRef(true);

  const updateFilters = useCallback(
    (newSearch: string) => {
      const params = new URLSearchParams(searchParams.toString());

      const trimmedSearch = newSearch.trim();
      if (trimmedSearch) {
        params.set('search', trimmedSearch);
      } else {
        params.delete('search');
      }

      params.set('page', '1');

      startTransition(() => {
        const url = `/configuration-settings/module-master?${params.toString()}`;
        router.push(`/${locale}${url}`);
      });
    },
    [locale, router, searchParams, startTransition]
  );

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setSearch(currentSearchTerm);
  }, [currentSearchTerm]);

  useEffect(() => {
    if (search === currentSearchTerm) return;

    const timer = setTimeout(() => {
      updateFilters(search);
    }, 500);

    return () => clearTimeout(timer);
  }, [search, currentSearchTerm, updateFilters]);

  const handleSearchChange = (value: string) => {
    const sanitized = value.replace(TEXT_SANITIZE, '');
    setSearch(sanitized);
  };

  return {
    search,
    currentSearchTerm,
    handleSearchChange,
  };
}
