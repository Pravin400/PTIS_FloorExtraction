import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";

interface UseRateSectionListParams {
  initialWardCounts: Record<string, number>;
  initialSearch: string;
  totalCount: number;
  pageSize: number;
}

export function useRateSectionList({
  initialWardCounts,
  initialSearch,
  totalCount,
  pageSize
}: UseRateSectionListParams) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Track ward counts with accumulation/merging behavior
  // This ensures counts persist even when a rate section isn't currently selected
  const [wardCounts, setWardCounts] = useState<Record<string, number>>(initialWardCounts);
  
  // Track previous initialWardCounts to detect changes
  const prevWardCountsRef = useRef<Record<string, number>>(initialWardCounts);
  
  // Local search value - ALWAYS the source of truth for the input display
  const [searchValue, setSearchValue] = useState(initialSearch);
  
  // Track if we're currently updating the URL to avoid loops
  const isUpdatingUrl = useRef(false);
  
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const effectivePageSize = pageSize || 10;
  const totalPages = Math.ceil(totalCount / effectivePageSize);

  // Update ward counts when new data arrives
  // Moved to useEffect to avoid calling setState during render
  useEffect(() => {
    if (!initialWardCounts || Object.keys(initialWardCounts).length === 0) return;
    
    // Check if initialWardCounts has actually changed by comparing with previous value
    const hasChanges = Object.keys(initialWardCounts).some(
      key => prevWardCountsRef.current[key] !== initialWardCounts[key]
    );
    
    if (hasChanges) {
      prevWardCountsRef.current = initialWardCounts;
      setWardCounts(prev => ({ ...prev, ...initialWardCounts }));
    }
  }, [initialWardCounts]); // Only depend on initialWardCounts, not wardCounts

  // Sync local state with URL when initialSearch changes externally (e.g., browser back/forward)
  // Only sync if we're not currently updating the URL ourselves
  useEffect(() => {
    if (!isUpdatingUrl.current && initialSearch !== searchValue) {
      setSearchValue(initialSearch);
    }
  }, [initialSearch]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounced URL update when search value changes
  useEffect(() => {
    const currentQ = searchParams?.get("q") || "";
    
    // Skip if values are the same
    if (searchValue.trim() === currentQ.trim()) {
      return;
    }

    isUpdatingUrl.current = true;
    
    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams?.toString());
      if (searchValue.trim()) {
        params.set("q", searchValue.trim());
      } else {
        params.delete("q");
      }
      params.set("ratesectionpage", "1");
      router.push(`${pathname}?${params.toString()}`);
      
      // Reset flag after a short delay to allow navigation to complete
      setTimeout(() => {
        isUpdatingUrl.current = false;
      }, 100);
    }, 300);

    return () => {
      clearTimeout(timer);
      isUpdatingUrl.current = false;
    };
  }, [searchValue, router, pathname, searchParams]);

  const changePageSize = useCallback((size: number) => {
    const params = new URLSearchParams(searchParams?.toString());
    params.set("ratesectionpagesize", size.toString());
    params.set("ratesectionpage", "1");
    params.set("wardpage", "1");
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  const handlePageChange = useCallback((page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("ratesectionpage", page.toString());
    params.set("wardpage", "1");
    router.push(`${pathname}?${params.toString()}`);
  }, [searchParams, pathname, router]);

  return {
    wardCounts,
    deletingId,
    setDeletingId,
    searchValue,
    setSearchValue,
    totalPages,
    effectivePageSize,
    changePageSize,
    handlePageChange
  };
}
