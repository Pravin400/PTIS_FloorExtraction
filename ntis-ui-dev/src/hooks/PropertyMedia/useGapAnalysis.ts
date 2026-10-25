'use client';

import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQueryTransition } from "@/hooks/useQueryTransition";
import { useDebounce } from "@/hooks/useDebounce";
import { TableData } from "@/types/PropertyMedia/PropertyMedia.types";
import { PropertyMediaCategoryEnum } from "@/lib/constants/propertyMedia.constants";

export interface UseGapAnalysisProps {
  tableData?: TableData;
}

/**
 * Sanitizes search input:
 * - Allows characters (including multilingual letters & marks) and numbers.
 * - Disallows special characters.
 * - Disallows leading space.
 * - Normalizes consecutive spaces to a single space.
 */
export const sanitizeSearchInput = (value: string): string => {
  return value
    .replace(/[^\p{L}\p{M}\p{N}\s]/gu, "")
    .replace(/^\s+/, "")
    .replace(/\s+/g, " ");
};

export function useGapAnalysis() {
  const { isPending, updateQueries, searchParams } = useQueryTransition();
  const t = useTranslations("propertyMedia");

  const [pendingCategory, setPendingCategory] = useState<string | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);


  // URL Parameters as Single Source of Truth

  const activeCategory = (searchParams.get("category") || "").toLowerCase() as string | "";
  const searchQuery = searchParams.get("q") || searchParams.get("search") || "";

  // Reset pending category when the URL activeCategory updates
  const [prevActiveCategory, setPrevActiveCategory] = useState(activeCategory);
  if (activeCategory !== prevActiveCategory) {
    setPrevActiveCategory(activeCategory);
    setPendingCategory(null);
  }

  // Local state for immediate typing feedback
  const [searchTerm, setSearchTerm] = useState<string>(searchQuery);
  const lastPushedQueryRef = useRef(searchQuery);

  // Only update local state if URL was changed externally
  useEffect(() => {
    if (searchQuery !== lastPushedQueryRef.current) {
      lastPushedQueryRef.current = searchQuery;
      setSearchTerm(searchQuery);
    }
  }, [searchQuery]);

  // Debounced Search Sync to URL

  const debouncedSearch = useDebounce(searchTerm, 400);

  useEffect(() => {
    const trimmed = debouncedSearch.trim();
    if (trimmed !== searchQuery.trim()) {
      lastPushedQueryRef.current = trimmed;
      updateQueries({ q: trimmed || null });
    }
  }, [debouncedSearch, searchQuery, updateQueries]);

  // Input & Filter Handlers

  const handleSearchChange = useCallback((value: string) => {
    const sanitized = sanitizeSearchInput(value);
    setSearchTerm(sanitized);
  }, []);

  const handleCategoryClick = useCallback(
    (category: string) => {
      setPendingCategory(category);

      updateQueries({
        category: category || null,
        page: null,
        pageSize: null,
      });
    },
    [updateQueries]
  );

  const handleShowAll = useCallback(() => {
    setPendingCategory("");

    updateQueries({
      category: null,
      page: null,
      pageSize: null,
    });
  }, [updateQueries]);

  const handleFilterClick = useCallback(() => {
    searchInputRef.current?.focus();
  }, []);

  const handlePageChange = useCallback(
    (page: number) => {
      updateQueries({ page });
    },
    [updateQueries]
  );

  const handlePageSizeChange = useCallback(
    (size: number) => {
      updateQueries({ pageSize: size, page: 1 });
    },
    [updateQueries]
  );


  // Derived Category Label & Show All State

  const effectiveCategory = pendingCategory !== null ? pendingCategory : activeCategory;

  const isShowAllDisabled = !effectiveCategory;

  const currentCategoryLabel = useMemo(() => {
    if (!effectiveCategory) {
      return t("detailedCoverageHeader.allItems");
    }
    switch (effectiveCategory) {
      case String(PropertyMediaCategoryEnum.PHOTO):
        return t("gapAnalysis.categories.photo");
      case String(PropertyMediaCategoryEnum.PLAN):
        return t("gapAnalysis.categories.plan");
      case String(PropertyMediaCategoryEnum.DOCUMENT):
        return t("gapAnalysis.categories.document");
      default:
        return effectiveCategory;
    }
  }, [effectiveCategory, t]);

  return {
    // References
    searchInputRef,
    // URL States
    activeCategory,
    effectiveCategory,
    searchQuery,
    searchTerm,
    isPending,
    // UI Helpers
    currentCategoryLabel,
    isShowAllDisabled,
    // Handlers
    handleSearchChange,
    handleCategoryClick,
    handleShowAll,
    handleFilterClick,
    handlePageChange,
    handlePageSizeChange,
    sanitizeSearch: sanitizeSearchInput,
    t,
  };
}
