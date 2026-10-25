import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSearchNavigation } from "@/hooks/useSearchNavigation";
import { TEXT_SANITIZE } from "@/lib/utils/validation";

interface UsePropertyTypeSearchProps {
  pageSize: number;
  locale: string;
  sortBy?: string;
  sortOrder?: string;
  startTransition: (callback: () => void) => void;
}

export function usePropertyTypeSearch({
  pageSize,
  locale,
  sortBy,
  sortOrder,
  startTransition,
}: UsePropertyTypeSearchProps) {
  const searchParams = useSearchParams();
  const currentSearchTerm = searchParams.get("q") || "";
  const [search, setSearch] = useState(currentSearchTerm);
  const [prevSearch, setPrevSearch] = useState(currentSearchTerm);

  // Sync search state with URL on mount/navigation (without useEffect)
  if (currentSearchTerm !== prevSearch) {
    setPrevSearch(currentSearchTerm);
    setSearch(currentSearchTerm);
  }

  // Debounced search navigation
  useSearchNavigation({
    search,
    currentSearchTerm,
    pageSize,
    locale,
    sortBy,
    sortOrder,
    basePath: "/property-tax/propertytype",
    startTransition,
  });

  const handleSearchChange = (value: string) => {
    // Sanitize search input to prevent special characters
    const sanitized = value.replace(TEXT_SANITIZE, "");
    setSearch(sanitized);
  };

  return {
    search,
    currentSearchTerm,
    handleSearchChange,
  };
}
