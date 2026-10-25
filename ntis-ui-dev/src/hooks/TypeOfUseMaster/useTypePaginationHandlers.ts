/**
 * Custom hook for Type pagination handlers in Type of Use Master
 * Handles page and page size changes for the Types section
 */

import { useCallback } from "react";

interface UseTypePaginationHandlersProps {
  selectedGroupId: string | number | null;
  typePageSize: number;
  pushUrl: (params: Record<string, string | number>) => void;
}

/**
 * Hook to manage type pagination handlers
 * Provides stable callback functions for page and page size changes
 */
export function useTypePaginationHandlers({
  selectedGroupId,
  typePageSize,
  pushUrl,
}: UseTypePaginationHandlersProps) {
  const handleTypePageChange = useCallback(
    (page: number) => {
      const currentGroupApiId = String(selectedGroupId);
      pushUrl({
        groupId: currentGroupApiId,
        typePn: page,
        typePs: typePageSize,
      });
    },
    [selectedGroupId, typePageSize, pushUrl]
  );

  const handleTypePageSizeChange = useCallback(
    (size: number) => {
      const currentGroupApiId = String(selectedGroupId);
      pushUrl({
        groupId: currentGroupApiId,
        typePn: 1,
        typePs: size,
      });
    },
    [selectedGroupId, pushUrl]
  );

  return {
    handleTypePageChange,
    handleTypePageSizeChange,
  };
}
