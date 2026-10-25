import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { TEXT_SANITIZE } from '@/lib/utils/validation';
import { useDebounce } from '@/hooks/useDebounce';

interface UseFloorSearchProps {
  onSearchChange: (search: string) => void;
  startTransition: (callback: () => void) => void;
}

export function useFloorSearch({
  onSearchChange,
  startTransition,
}: UseFloorSearchProps) {
  const searchParams = useSearchParams();
  const currentSearchTerm = searchParams.get('search') || '';
  const [search, setSearch] = useState(currentSearchTerm);
  
  // Sync with URL changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSearch(currentSearchTerm);
  }, [currentSearchTerm]);

  // Debounced search value
  const debouncedSearch = useDebounce(search, 500);

  // Trigger navigation when debounced search changes
  useEffect(() => {
    if (debouncedSearch !== currentSearchTerm) {
      startTransition(() => {
        onSearchChange(debouncedSearch);
      });
    }
  }, [debouncedSearch, currentSearchTerm, onSearchChange, startTransition]);

  const handleSearchChange = (value: string) => {
    // Sanitize search input to prevent special characters
    const sanitized = value.replace(TEXT_SANITIZE, '');
    setSearch(sanitized);
  };

  return {
    search,
    currentSearchTerm,
    handleSearchChange,
  };
}
