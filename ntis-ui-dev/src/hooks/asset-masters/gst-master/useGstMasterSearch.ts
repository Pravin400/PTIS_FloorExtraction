"use client";

import { useCallback, useEffect, useState, useTransition, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { TEXT_SANITIZE } from "@/lib/utils/asset-validation-rules";

interface UseGstMasterSearchProps {
  pageSize: number;
  locale: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useGstMasterSearch({
  pageSize,
  locale,
  sortBy,
  sortOrder,
}: UseGstMasterSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearchTerm = searchParams.get("q") || "";
  const [, startTransition] = useTransition();
  const [search, setSearch] = useState(currentSearchTerm);
  const debouncedSearch = useDebounce(search, 300);
  const normalizedPageSize = useMemo(() => {
    const allowedSizes = [10, 20, 30, 40, 50];
    if (allowedSizes.includes(pageSize)) return pageSize;

    return allowedSizes.reduce((prev, curr) =>
      Math.abs(curr - pageSize) < Math.abs(prev - pageSize) ? curr : prev
    );
  }, [pageSize]);

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
    params.set("pageSize", String(normalizedPageSize));
    if (trimmed) params.set("q", trimmed);
    if (sortBy) params.set("sortBy", sortBy);
    if (sortOrder) params.set("sortOrder", sortOrder);

    router.push(`/${locale}/assets/configuration/master-data/gst-master?${params.toString()}`);
  }, [debouncedSearch, currentSearchTerm, normalizedPageSize, locale, sortBy, sortOrder, router]);

  return {
    search,
    currentSearchTerm: currentSearchTerm.trim() || undefined,
    handleSearchChange,
  };
}