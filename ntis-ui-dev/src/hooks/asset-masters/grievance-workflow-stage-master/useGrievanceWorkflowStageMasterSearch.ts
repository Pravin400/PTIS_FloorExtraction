"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebounce } from "@/hooks/useDebounce";
import { TEXT_SANITIZE } from "@/lib/utils/asset-validation-rules";

import { GRIEVANCE_WORKFLOW_STAGE_PAGE_SIZES } from "@/types/asset-masters/grievance-workflow-stage-master.types";

interface UseGrievanceWorkflowStageMasterSearchProps {
  pageSize: number;
  locale: string;
  sortBy?: string;
  sortOrder?: string;
}

export function useGrievanceWorkflowStageMasterSearch({
  pageSize,
  locale,
  sortBy,
  sortOrder,
}: UseGrievanceWorkflowStageMasterSearchProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSearchTerm = searchParams?.get("q") || "";
  const [search, setSearch] = useState(currentSearchTerm);
  const [prevSearchTerm, setPrevSearchTerm] = useState(currentSearchTerm);
  if (currentSearchTerm !== prevSearchTerm) {
    setPrevSearchTerm(currentSearchTerm);
    setSearch(currentSearchTerm);
  }
  const debouncedSearch = useDebounce(search, 300);

  const normalizedPageSize = useMemo(() => {
    const allowedSizes: readonly number[] = GRIEVANCE_WORKFLOW_STAGE_PAGE_SIZES;
    if (allowedSizes.includes(pageSize)) return pageSize;

    return allowedSizes.reduce((prev, curr) =>
      Math.abs(curr - pageSize) < Math.abs(prev - pageSize) ? curr : prev
    );
  }, [pageSize]);

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

    router.push(
      `/${locale}/assets/configuration/master-data/grievance-workflow-stage?${params.toString()}`
    );
  }, [debouncedSearch, currentSearchTerm, normalizedPageSize, locale, sortBy, sortOrder, router]);

  return {
    search,
    currentSearchTerm: currentSearchTerm.trim() || undefined,
    handleSearchChange,
  };
}
