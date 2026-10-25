'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PolicyModeItem } from '@/types/retrospective-rule.types';
import {
  getRateModesAction,
  getPercentageModesAction,
  getTaxPolicyAction,
} from '@/app/[locale]/property-tax/retrospective-rule-library/action';

export interface TaxPolicyItem {
  id?: number;
  rateMode: string;
  percentageMode: string;
  [key: string]: unknown;
}

export interface UseTaxationModesReturn {
  rateModes: PolicyModeItem[];
  percentageModes: PolicyModeItem[];
  activePolicy: TaxPolicyItem | null;
  isConfigured: boolean;
  isLoading: boolean;
  error: string | null;
  refetchModes: () => Promise<void>;
}

export interface UseTaxationModesOptions {
  initialRateModes?: PolicyModeItem[];
  initialPercentageModes?: PolicyModeItem[];
  initialActivePolicy?: TaxPolicyItem | null;
}

export function useTaxationModes(options?: UseTaxationModesOptions): UseTaxationModesReturn {
  const hasInitialData = Boolean(
    (options?.initialRateModes && options.initialRateModes.length > 0) ||
    (options?.initialPercentageModes && options.initialPercentageModes.length > 0)
  );

  const [rateModes, setRateModes] = useState<PolicyModeItem[]>(options?.initialRateModes || []);
  const [percentageModes, setPercentageModes] = useState<PolicyModeItem[]>(options?.initialPercentageModes || []);
  const [activePolicy, setActivePolicy] = useState<TaxPolicyItem | null>(options?.initialActivePolicy || null);
  const [isLoading, setIsLoading] = useState<boolean>(!hasInitialData);
  const [error, setError] = useState<string | null>(null);

  const refetchModes = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [rateRes, percentageRes, policyRes] = await Promise.all([
        getRateModesAction(),
        getPercentageModesAction(),
        getTaxPolicyAction(),
      ]);

      if (rateRes.success && rateRes.data && rateRes.data.length > 0) {
        setRateModes(rateRes.data);
      }
      if (percentageRes.success && percentageRes.data && percentageRes.data.length > 0) {
        setPercentageModes(percentageRes.data);
      }
      if (policyRes.success && policyRes.data) {
        setActivePolicy(policyRes.data as TaxPolicyItem);
      } else {
        setActivePolicy(null);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch taxation modes');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!hasInitialData) {
      Promise.all([
        getRateModesAction(),
        getPercentageModesAction(),
        getTaxPolicyAction(),
      ])
        .then(([rateRes, percentageRes, policyRes]) => {
          if (!isMounted) return;
          if (rateRes.success && rateRes.data && rateRes.data.length > 0) {
            setRateModes(rateRes.data);
          }
          if (percentageRes.success && percentageRes.data && percentageRes.data.length > 0) {
            setPercentageModes(percentageRes.data);
          }
          if (policyRes.success && policyRes.data) {
            setActivePolicy(policyRes.data as TaxPolicyItem);
          } else {
            setActivePolicy(null);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            setError(err instanceof Error ? err.message : 'Failed to fetch taxation modes');
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
    rateModes,
    percentageModes,
    activePolicy,
    isConfigured: activePolicy !== null,
    isLoading,
    error,
    refetchModes,
  };
}
