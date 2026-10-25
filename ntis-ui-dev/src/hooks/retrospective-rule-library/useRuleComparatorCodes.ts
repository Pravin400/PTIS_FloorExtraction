'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RuleComparatorCodeItem } from '@/types/retrospective-rule.types';
import { getComparatorCodesAction } from '@/app/[locale]/property-tax/retrospective-rule-library/action';

export interface UseRuleComparatorCodesReturn {
  comparatorCodes: RuleComparatorCodeItem[];
  isLoading: boolean;
  error: string | null;
  refetchComparatorCodes: () => Promise<void>;
}

export interface UseRuleComparatorCodesOptions {
  initialComparatorCodes?: RuleComparatorCodeItem[];
}

export function useRuleComparatorCodes(
  options?: UseRuleComparatorCodesOptions
): UseRuleComparatorCodesReturn {
  const hasInitialData = Boolean(
    options?.initialComparatorCodes && options.initialComparatorCodes.length > 0
  );

  const [comparatorCodes, setComparatorCodes] = useState<RuleComparatorCodeItem[]>(
    options?.initialComparatorCodes || []
  );
  const [isLoading, setIsLoading] = useState<boolean>(!hasInitialData);
  const [error, setError] = useState<string | null>(null);

  const refetchComparatorCodes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getComparatorCodesAction();
      if (res.success && res.data && res.data.length > 0) {
        setComparatorCodes(res.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch comparator codes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!hasInitialData) {
      getComparatorCodesAction()
        .then((res) => {
          if (!isMounted) return;
          if (res.success && res.data && res.data.length > 0) {
            setComparatorCodes(res.data);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            setError(err instanceof Error ? err.message : 'Failed to fetch comparator codes');
          }
        })
        .finally(() => {
          if (isMounted) {
            setIsLoading(false);
          }
        });
    }
    return () => {
      isMounted = false;
    };
  }, [hasInitialData]);

  return {
    comparatorCodes,
    isLoading,
    error,
    refetchComparatorCodes,
  };
}
