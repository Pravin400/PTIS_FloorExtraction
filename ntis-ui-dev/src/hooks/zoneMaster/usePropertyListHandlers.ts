import { useCallback, useState, useEffect, useRef } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { TEXT_SANITIZE } from "@/lib/utils/validation";

interface UsePropertyListHandlersProps {
  selectedWardId: number | null;
  selectedZoneId: number | null;
  searchTerm: string;
  pageNumber: number;
  pageSize: number;
}

export function usePropertyListHandlers({
  selectedWardId,
  selectedZoneId,
  searchTerm,
  pageNumber: _pageNumber,
  pageSize,
}: UsePropertyListHandlersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [localSearch, setLocalSearch] = useState(searchTerm);
  const prevSearchTermRef = useRef(searchTerm);

  // Sync search from URL when it changes
  useEffect(() => {
    if (prevSearchTermRef.current !== searchTerm) {
      prevSearchTermRef.current = searchTerm;
      setLocalSearch(searchTerm);
    }
  }, [searchTerm]);

  // Debounced search
  useEffect(() => {
    if (selectedWardId === null || localSearch === searchTerm) return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("propPage", "1");

      if (localSearch.trim()) {
        params.set("propQ", localSearch.trim());
      } else {
        params.delete("propQ");
      }

      router.push(`${pathname}?${params.toString()}`);
    }, 400);

    return () => clearTimeout(timer);
  }, [localSearch, searchTerm, selectedWardId, router, pathname, searchParams]);

  const handleSearchChange = useCallback((value: string) => {
    // Sanitize search input to prevent special characters
    const sanitized = value.replace(TEXT_SANITIZE, '');
    setLocalSearch(sanitized);
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("propPage", String(page));
      params.set("propPageSize", String(pageSize));

      if (searchTerm) {
        params.set("propQ", searchTerm);
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, pageSize, searchTerm, router, pathname]
  );

  const handlePageSizeChange = useCallback(
    (newPageSize: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("propPage", "1");
      params.set("propPageSize", String(newPageSize));

      if (searchTerm) {
        params.set("propQ", searchTerm);
      }

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, searchTerm, router, pathname]
  );

  const handleWardChange = useCallback(
    (wardIdValue: string) => {
      const params = new URLSearchParams(searchParams.toString());

      // Keep zone selection
      if (selectedZoneId !== null) {
        params.set("zoneId", String(selectedZoneId));
      }

      if (wardIdValue) {
        params.set("propWardId", wardIdValue);
      } else {
        params.delete("propWardId");
      }

      // Reset property pagination when ward changes
      params.set("propPage", "1");
      params.delete("propQ");

      router.push(`${pathname}?${params.toString()}`);
    },
    [searchParams, selectedZoneId, router, pathname]
  );

  return {
    localSearch,
    handleSearchChange,
    handlePageChange,
    handlePageSizeChange,
    handleWardChange,
  };
}
