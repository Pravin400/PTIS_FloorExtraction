"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";

interface UseAssetFieldDefinitionSearchProps {
  pageSize: number;
  locale: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useAssetFieldDefinitionSearch({
  pageSize,
  locale,
  sortBy,
  sortOrder,
}: UseAssetFieldDefinitionSearchProps) {
  const router = useRouter();
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const initialQ = searchParams?.get("q") || "";
  const [search, setSearch] = useState(initialQ);
  const debouncedSearch = useDebounce(search, 300);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const currentQ = params.get("q") || "";
    if (debouncedSearch !== currentQ) {
      if (debouncedSearch.trim()) {
        params.set("q", debouncedSearch.trim());
      } else {
        params.delete("q");
      }
      params.set("page", "1");
      if (pageSize) params.set("pageSize", String(pageSize));
      if (sortBy) params.set("sortBy", sortBy);
      if (sortOrder) params.set("sortOrder", sortOrder);
      router.push(`/${locale}/assets/configuration/master-data/asset-field-definition?${params.toString()}`);
    }
  }, [debouncedSearch, locale, router, pageSize, sortBy, sortOrder]);

  return {
    search,
    setSearch,
  };
}

export function useAssetFieldDefinitionList(
  sortBy?: string,
  sortOrder?: string,
  locale?: string
) {
  const router = useRouter();

  const handleSort = useCallback(
    (columnKey: string) => {
      let newSortOrder = "asc";
      if (sortBy === columnKey) {
        newSortOrder = sortOrder === "asc" ? "desc" : "asc";
      }
      const params = new URLSearchParams(window.location.search);
      params.set("sortBy", columnKey);
      params.set("sortOrder", newSortOrder);
      params.set("page", "1");
      router.push(`/${locale}/assets/configuration/master-data/asset-field-definition?${params.toString()}`);
    },
    [sortBy, sortOrder, router, locale]
  );

  return { handleSort };
}
