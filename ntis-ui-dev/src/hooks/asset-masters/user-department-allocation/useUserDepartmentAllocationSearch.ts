"use client";

import { useState, useCallback, useEffect, useTransition, useRef } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { USER_SEARCH_SANITIZE } from "@/lib/utils/asset-validation-rules";

interface UseUserDepartmentAllocationSearchProps {
  pageSize: number;
  locale?: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useUserDepartmentAllocationSearch({
  pageSize,
  locale,
  sortBy,
  sortOrder,
}: UseUserDepartmentAllocationSearchProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentSearchTerm = searchParams.get("q") || searchParams.get("search") || "";
  const [search, setSearch] = useState(currentSearchTerm);
  const debouncedSearch = useDebounce(search, 500);
  const [, startTransition] = useTransition();
  const lastPushedUrlRef = useRef(currentSearchTerm);

  // Sync internal search state when URL changes externally (e.g. back/forward or external navigation)
  useEffect(() => {
    // If URL matches what this hook initiated, do not overwrite local search
    // to preserve any newer keystrokes the user is actively typing.
    if (currentSearchTerm.trim() === lastPushedUrlRef.current.trim()) {
      return;
    }
    lastPushedUrlRef.current = currentSearchTerm;
    startTransition(() => {
      setSearch(currentSearchTerm);
    });
  }, [currentSearchTerm, startTransition]);

  const handleSearchChange = useCallback((value: string) => {
    let sanitized = value.replace(USER_SEARCH_SANITIZE, "");
    sanitized = sanitized.trimStart().replace(/\s{2,}/g, " ");
    setSearch(sanitized);
  }, []);

  // Trigger search update when debouncedSearch differs from current URL
  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    const current = currentSearchTerm.trim();
    if (trimmed === current) return;

    const params = new URLSearchParams();
    params.set("page", "1");
    params.set("pageSize", String(pageSize));
    if (trimmed) {
      params.set("q", trimmed);
    }
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);

    const targetUrl = locale
      ? `/${locale}/assets/configuration/master-data/user-department-allocation?${params.toString()}`
      : `${pathname}?${params.toString()}`;

    lastPushedUrlRef.current = trimmed;
    router.push(targetUrl);
  }, [debouncedSearch, currentSearchTerm, pageSize, locale, sortBy, sortOrder, pathname, router]);

  return {
    search,
    currentSearchTerm: currentSearchTerm.trim() || undefined,
    handleSearchChange,
  };
}
