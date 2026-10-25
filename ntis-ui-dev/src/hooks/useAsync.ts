import { useState, useCallback } from 'react';
import { ApiResponse } from '@/types/common.types';

/**
 * Custom hook for handling async operations with loading and error states
 */
export function useAsync<T>() {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (asyncFn: () => Promise<ApiResponse<T>>) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await asyncFn();

      if (response.success && response.data) {
        setData(response.data);
      } else {
        setError(response.error || 'An error occurred');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return { data, error, isLoading, execute, reset };
}
