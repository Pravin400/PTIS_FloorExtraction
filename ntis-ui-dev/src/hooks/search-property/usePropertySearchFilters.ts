"use client";

import { useMemo } from "react";
import type { UsePropertySearchFiltersProps } from "@/types/property-search";

/**
 * Hook for managing filtered lookup options.
 * Ensures Property No "To" only shows values greater than "From".
 */
export function usePropertySearchFilters({
  lookupOptions,
  propertyNoFrom,
}: UsePropertySearchFiltersProps) {
  /**
   * Filter propertyNoTo options to only show values greater than propertyNoFrom
   */
  const filteredPropertyNoToOptions = useMemo(() => {
    if (!propertyNoFrom) {
      return lookupOptions.propertyNos;
    }
    return lookupOptions.propertyNos.filter(
      (p) => p.localeCompare(propertyNoFrom, undefined, { numeric: true }) > 0
    );
  }, [lookupOptions.propertyNos, propertyNoFrom]);

  return {
    propertyNoToOptions: filteredPropertyNoToOptions,
  };
}
