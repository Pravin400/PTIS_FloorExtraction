"use client";

import { useState, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useSearchNavigation } from "@/hooks/useSearchNavigation";
import { TEXT_SANITIZE } from "@/lib/utils/validation";

interface UseOfficeSearchProps {
  pageSize: number;
  locale: string;
  sortBy?: string;
  sortOrder?: string;
  startTransition: (callback: () => void) => void;
  type?: string;
  status?: string;
}

export function useOfficeSearch({
  pageSize,
  locale,
  sortBy,
  sortOrder,
  startTransition,
  type,
  status,
}: UseOfficeSearchProps) {
  const searchParams = useSearchParams();
  const currentSearchTerm = searchParams.get("q") || "";
  const [search, setSearch] = useState(currentSearchTerm);
  const [prevSearchTerm, setPrevSearchTerm] = useState(currentSearchTerm);
  if (currentSearchTerm !== prevSearchTerm) {
    setPrevSearchTerm(currentSearchTerm);
    setSearch(currentSearchTerm);
  }

  const [selectedType, setSelectedType] = useState(type || "");
  const [prevType, setPrevType] = useState(type || "");
  if ((type || "") !== prevType) {
    setPrevType(type || "");
    setSelectedType(type || "");
  }

  const [selectedStatus, setSelectedStatus] = useState(status || "");
  const [prevStatus, setPrevStatus] = useState(status || "");
  if ((status || "") !== prevStatus) {
    setPrevStatus(status || "");
    setSelectedStatus(status || "");
  }

  const extraParams = useMemo(() => ({
    type: selectedType,
    status: selectedStatus,
  }), [selectedType, selectedStatus]);

  // Debounced search navigation
  useSearchNavigation({
    search,
    currentSearchTerm,
    pageSize,
    locale,
    sortBy,
    sortOrder,
    basePath: "/configuration-settings/office-master",
    startTransition,
    extraParams,
  });

  const handleSearchChange = (value: string) => {
    // Sanitize search input to prevent special characters
    const sanitized = value.replace(TEXT_SANITIZE, "");
    setSearch(sanitized);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedType(e.target.value);
  };

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedStatus(e.target.value);
  };

  return {
    search,
    currentSearchTerm,
    handleSearchChange,
    selectedType,
    handleTypeChange,
    selectedStatus,
    handleStatusChange,
  };
}
