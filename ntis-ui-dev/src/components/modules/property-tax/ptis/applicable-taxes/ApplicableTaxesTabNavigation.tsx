import { useState, useEffect, useCallback } from 'react';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search } from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

export function ApplicableTaxesTabNavigation() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const t = useTranslations('applicableTaxes');

  const searchQuery = searchParams.get('search') || '';

  // Local state for immediate typing feedback
  const [prevSearchQuery, setPrevSearchQuery] = useState(searchQuery);
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync localSearch when URL search parameter changes externally during render
  if (searchQuery !== prevSearchQuery) {
    setPrevSearchQuery(searchQuery);
    setLocalSearch(searchQuery);
  }

  // Debounce local search value
  const debouncedSearch = useDebounce(localSearch, 300);

  // Build query string helper (memoized)
  const getQueryString = useCallback((override: Record<string, string>) => {
    const queryParams = new URLSearchParams(searchParams.toString());

    const currentSearch = override.search !== undefined ? override.search : localSearch;
    if (currentSearch) {
      queryParams.set('search', currentSearch);
    } else {
      queryParams.delete('search');
    }
    return queryParams.toString();
  }, [searchParams, localSearch]);

  // Trigger router update when debouncedSearch value changes
  useEffect(() => {
    if (debouncedSearch !== searchQuery) {
      const newQuery = getQueryString({ search: debouncedSearch });
      router.replace(`${pathname}?${newQuery}`);
    }
  }, [debouncedSearch, searchQuery, getQueryString, router, pathname]);


  return (
    <div className="flex flex-row items-center justify-between gap-3 mb-4 bg-white p-0">
      {/* Search Input on Left */}
      <div className="relative flex-1 min-w-0">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-3.5 w-3.5 text-slate-400" />
        </div>
        <input
          type="text"
          placeholder={t('searchPlaceholder') || 'Search tax head'}
          value={localSearch}
          onChange={(e) => setLocalSearch(e.target.value)}
          className="w-full h-9 rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        />
      </div>
    </div>
  );
}


export default ApplicableTaxesTabNavigation;