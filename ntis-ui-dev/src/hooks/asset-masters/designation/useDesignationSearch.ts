"use client";

import { useState, useCallback, useEffect, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { TEXT_SANITIZE } from "@/lib/utils/asset-validation-rules";

interface UseDesignationSearchProps {
  pageSize: number;
  locale: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useDesignationSearch({
  pageSize,
  locale,
  sortBy,
  sortOrder,
}: UseDesignationSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearchTerm = searchParams.get("q") || "";
  const [search, setSearch] = useState(currentSearchTerm);
  const debouncedSearch = useDebounce(search, 300);
  const [, startTransition] = useTransition();

  useEffect(() => {
    startTransition(() => {
      setSearch(currentSearchTerm);
    });
  }, [currentSearchTerm, startTransition]);

  const handleSearchChange = useCallback((value: string) => {
    let sanitized = value.replace(TEXT_SANITIZE, "");
    sanitized = sanitized.trimStart().replace(/\s{2,}/g, " ");
    setSearch(sanitized);
  }, []);

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

    router.push(`/${locale}/assets/configuration/master-data/designation-master?${params.toString()}`);
  }, [debouncedSearch, currentSearchTerm, pageSize, locale, sortBy, sortOrder, router]);

  return {
    search,
    currentSearchTerm: currentSearchTerm.trim() || undefined,
    handleSearchChange,
  };
}
