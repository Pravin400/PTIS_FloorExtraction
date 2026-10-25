import { useState, useCallback } from 'react';

/**
 * Hook to manage media panel visibility state.
 */
export function useMediaPanelVisibility(initialVisible: boolean = false) {
  const [isPanelVisible, setIsPanelVisible] = useState(initialVisible);

  const togglePanel = useCallback(() => {
    setIsPanelVisible((prev) => !prev);
  }, []);

  return {
    isPanelVisible,
    togglePanel,
  };
}
