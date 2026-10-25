import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useSearchNavigation } from '@/hooks/useSearchNavigation';
import { TEXT_SANITIZE } from '@/lib/utils/validation';

interface UseSocialAttributeSearchProps {
  pageSize: number;
  locale: string;
  sortBy?: string;
  sortOrder?: string;
  startTransition: (callback: () => void) => void;
}

export function useSocialAttributeSearch({
  pageSize,
  locale,
  sortBy,
  sortOrder,
  startTransition,
}: UseSocialAttributeSearchProps) {
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
    sortBy,
    sortOrder,
    basePath: '/property-tax/social-attribute-master',
    startTransition,
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
