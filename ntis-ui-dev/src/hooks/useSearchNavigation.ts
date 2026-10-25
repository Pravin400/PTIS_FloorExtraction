import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";

interface UseSearchNavigationProps {
  search: string;
  currentSearchTerm: string;
  pageSize: number;
  locale: string;
  sortBy?: string;
  sortOrder?: string;
  basePath: string;
  debounceMs?: number;
  startTransition: (callback: () => void) => void;
  extraParams?: Record<string, string | number | boolean | undefined>;
  includePaginationParams?: boolean;
}

export function useSearchNavigation({
  search,
  currentSearchTerm,
  pageSize,
  locale,
  sortBy,
  sortOrder,
  basePath,
  debounceMs = 500,
  startTransition,
  extraParams,
  includePaginationParams = true,
}: UseSearchNavigationProps) {
  const router = useRouter();
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    const normalizePath = (path: string) => (path.endsWith("/") && path !== "/" ? path.slice(0, -1) : path);
    const baseRoute = `/${locale}${basePath}`;

    // Only trigger search URL updates on the base list route.
    // This prevents auto-navigation when list components are rendered behind add/edit drawers.
    if (normalizePath(pathname) !== normalizePath(baseRoute)) {
      return;
    }

    // Only trigger when user changes search term, not on initial mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Check if parameters have actually changed
    // We compare search, but we should also consider extraParams changes
    
    const timer = setTimeout(() => {
      const trimmedSearch = search.trim();

      // We compare the fully constructed new URL with the current URL 
      // instead of only checking if the search text changed.
      // This ensures that changes to extraParams (like filters) also trigger navigation.

      const params = new URLSearchParams();

      if (includePaginationParams) {
        params.set("page", "1");
        params.set("pageSize", String(pageSize));
      }
      
      if (trimmedSearch) {
        params.set("q", trimmedSearch);
      }
      
      // Preserve sort params when searching
      if (sortBy) {
        params.set("sortBy", sortBy);
      }
      if (sortOrder) {
        params.set("sortOrder", sortOrder);
      }

      // Add extra parameters
      if (extraParams) {
        Object.entries(extraParams).forEach(([key, value]) => {
          if (value !== undefined && value !== "") {
            params.set(key, String(value));
          }
        });
      }
      
      const query = params.toString();
      const newUrl = query ? `/${locale}${basePath}?${query}` : `/${locale}${basePath}`;
      
      const currentParams = new URLSearchParams(window.location.search);
      
      // Semantically compare parameters to avoid infinite loops due to ordering or encoding
      let isDifferent = false;
      
      // 1. Check if any new param is different from current
      for (const [key, value] of params.entries()) {
        if (currentParams.get(key) !== value) {
          isDifferent = true;
          break;
        }
      }
      
      // 2. Check if current URL has any tracked params that should be removed
      if (!isDifferent) {
        const trackedKeys = ['page', 'pageSize', 'q', 'sortBy', 'sortOrder', ...Object.keys(extraParams || {})];
        for (const key of currentParams.keys()) {
          if (trackedKeys.includes(key) && !params.has(key)) {
            isDifferent = true;
            break;
          }
        }
      }

      if (isDifferent) {
        startTransition(() => {
          router.push(newUrl);
        });
      }
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [search, pageSize, router, pathname, locale, currentSearchTerm, sortBy, sortOrder, basePath, debounceMs, startTransition, extraParams, includePaginationParams]);
}