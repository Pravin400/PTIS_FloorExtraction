import { useState, useEffect, useRef } from 'react';
import { useDebounce } from '@/hooks/useDebounce';

interface UseTypeSearchParams {
  typeSearchFromServer?: string;
  selectedGroupId: string | number;
  pushUrl: (params: {
    groupId?: string;
    typeSearch?: string;
    typeId?: string;
    pn?: number;
    typePn?: number;
  }) => void;
}

export function useTypeSearch({
  typeSearchFromServer,
  selectedGroupId,
  pushUrl,
}: UseTypeSearchParams) {
  const [typeSearch, setTypeSearch] = useState(typeSearchFromServer ?? "");
  const debouncedSearch = useDebounce(typeSearch, 400);

  const prevServerSearchRef = useRef(typeSearchFromServer);
  // Sync local state when the server-provided search value changes externally
  useEffect(() => {
    if (prevServerSearchRef.current !== typeSearchFromServer) {
      prevServerSearchRef.current = typeSearchFromServer;
      setTypeSearch(typeSearchFromServer ?? "");
    }
  }, [typeSearchFromServer]);

  useEffect(() => {
    // Only push if the debounced value differs from the server search value
    if (debouncedSearch === (typeSearchFromServer ?? "")) return;

    const currentGroupApiId = String(selectedGroupId);

    pushUrl({
      groupId: currentGroupApiId,
      typeSearch: debouncedSearch,
      typeId: undefined,
      pn: 1,
      typePn: 1,
    });
  }, [debouncedSearch, selectedGroupId, pushUrl, typeSearchFromServer]);

  const onTypeSearchChange = (val: string) => {
    setTypeSearch(val);
  };

  return {
    typeSearch,
    setTypeSearch,
    onTypeSearchChange,
  };
}
