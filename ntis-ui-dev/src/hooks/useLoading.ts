import { useState } from 'react';

/**
 * Custom hook for managing loading states
 */
export function useLoading(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState);

  return {
    isLoading,
    startLoading: () => setIsLoading(true),
    stopLoading: () => setIsLoading(false),
    setIsLoading,
  };
}
