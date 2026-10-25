import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSearchNavigation } from '@/hooks/useSearchNavigation';
import { TEXT_SANITIZE } from '@/lib/utils/validation';

interface UseGeographyUnitSearchProps {
  pageSize: number;
  locale: string;
  startTransition: (callback: () => void) => void;
}

export function useGeographyUnitSearch({
  pageSize,
  locale,
  startTransition,
}: UseGeographyUnitSearchProps) {
  const searchParams = useSearchParams();
  const currentSearchTerm = searchParams.get('q') || '';
  const [search, setSearch] = useState(currentSearchTerm);
  const [prevSearch, setPrevSearch] = useState(currentSearchTerm);
  if (currentSearchTerm !== prevSearch) {
    setPrevSearch(currentSearchTerm);
    setSearch(currentSearchTerm);
  }

  useSearchNavigation({
    search,
    currentSearchTerm,
    pageSize,
    locale,
    basePath: '/water-bill/geography-unit-master',
    startTransition,
    includePaginationParams: true,
  });

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
