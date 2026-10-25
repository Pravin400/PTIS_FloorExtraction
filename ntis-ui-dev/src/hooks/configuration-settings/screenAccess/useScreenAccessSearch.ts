'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQueryTransition } from '@/hooks/useQueryTransition';

interface UseScreenAccessSearchProps {
  initialSearchTerm?: string;
  searchParamKey?: string;
  pageParamKey?: string;
}

export function useScreenAccessSearch({
  initialSearchTerm = '',
  searchParamKey = 'search',
  pageParamKey = 'page',
}: UseScreenAccessSearchProps = {}) {
  const { isPending, updateQueries } = useQueryTransition();
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);

  const [prevInitialSearchTerm, setPrevInitialSearchTerm] = useState(initialSearchTerm);

  // Sync local state when URL changes (external changes like back/forward)
  // We do this during render to avoid cascading renders/effects
  if (initialSearchTerm !== prevInitialSearchTerm) {
    setPrevInitialSearchTerm(initialSearchTerm);
    setSearchTerm(initialSearchTerm);
  }

  // Debounce search updates to the URL
  useEffect(() => {
    // Skip if the term hasn't changed from what's already in the URL
    if (searchTerm === initialSearchTerm) return;

    const debounceId = setTimeout(() => {
      updateQueries({ [searchParamKey]: searchTerm }, { resetPage: true, pageParamKey });
    }, 500);

    return () => clearTimeout(debounceId);
  }, [searchTerm, initialSearchTerm, updateQueries, searchParamKey, pageParamKey]);

  const handleSearch = useCallback((term: string) => {
    setSearchTerm(term);
  }, []);

  return {
    searchTerm,
    isPending,
    handleSearch,
  };
}
