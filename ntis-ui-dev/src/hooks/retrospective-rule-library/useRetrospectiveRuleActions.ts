'use client';

import { useState, useEffect, useCallback } from 'react';
import type { RuleActionModeItem } from '@/types/retrospective-rule.types';
import {
  getTaxStartModesAction,
  getUseDateOptionsAction,
  getRetrospectiveLimitTypesAction,
  getTaxCalculationModesAction,
} from '@/app/[locale]/property-tax/retrospective-rule-library/action';

export interface UseRetrospectiveRuleActionsReturn {
  taxStartModes: RuleActionModeItem[];
  useDateOptions: RuleActionModeItem[];
  limitTypes: RuleActionModeItem[];
  taxCalculationModes: RuleActionModeItem[];
  isLoading: boolean;
  error: string | null;
  refetchActions: () => Promise<void>;
}

export interface UseRetrospectiveRuleActionsOptions {
  initialTaxStartModes?: RuleActionModeItem[];
  initialUseDateOptions?: RuleActionModeItem[];
  initialLimitTypes?: RuleActionModeItem[];
  initialTaxCalculationModes?: RuleActionModeItem[];
}

export function useRetrospectiveRuleActions(
  options?: UseRetrospectiveRuleActionsOptions
): UseRetrospectiveRuleActionsReturn {
  const hasInitialData = Boolean(
    (options?.initialTaxStartModes && options.initialTaxStartModes.length > 0) ||
    (options?.initialLimitTypes && options.initialLimitTypes.length > 0)
  );

  const [taxStartModes, setTaxStartModes] = useState<RuleActionModeItem[]>(
    options?.initialTaxStartModes || []
  );
  const [useDateOptions, setUseDateOptions] = useState<RuleActionModeItem[]>(
    options?.initialUseDateOptions || []
  );
  const [limitTypes, setLimitTypes] = useState<RuleActionModeItem[]>(
    options?.initialLimitTypes || []
  );
  const [taxCalculationModes, setTaxCalculationModes] = useState<RuleActionModeItem[]>(
    options?.initialTaxCalculationModes || []
  );
  const [isLoading, setIsLoading] = useState<boolean>(!hasInitialData);
  const [error, setError] = useState<string | null>(null);

  const refetchActions = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [startRes, useDateRes, limitRes, calcRes] = await Promise.all([
        getTaxStartModesAction(),
        getUseDateOptionsAction(),
        getRetrospectiveLimitTypesAction(),
        getTaxCalculationModesAction(),
      ]);

      if (startRes.success && startRes.data && startRes.data.length > 0) {
        setTaxStartModes(startRes.data);
      }
      if (useDateRes.success && useDateRes.data && useDateRes.data.length > 0) {
        setUseDateOptions(useDateRes.data);
      }
      if (limitRes.success && limitRes.data && limitRes.data.length > 0) {
        setLimitTypes(limitRes.data);
      }
      if (calcRes.success && calcRes.data && calcRes.data.length > 0) {
        setTaxCalculationModes(calcRes.data);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rule actions');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    if (!hasInitialData) {
      Promise.all([
        getTaxStartModesAction(),
        getUseDateOptionsAction(),
        getRetrospectiveLimitTypesAction(),
        getTaxCalculationModesAction(),
      ])
        .then(([startRes, useDateRes, limitRes, calcRes]) => {
          if (!isMounted) return;
          if (startRes.success && startRes.data && startRes.data.length > 0) {
            setTaxStartModes(startRes.data);
          }
          if (useDateRes.success && useDateRes.data && useDateRes.data.length > 0) {
            setUseDateOptions(useDateRes.data);
          }
          if (limitRes.success && limitRes.data && limitRes.data.length > 0) {
            setLimitTypes(limitRes.data);
          }
          if (calcRes.success && calcRes.data && calcRes.data.length > 0) {
            setTaxCalculationModes(calcRes.data);
          }
        })
        .catch((err: unknown) => {
          if (isMounted) {
            setError(err instanceof Error ? err.message : 'Failed to fetch rule actions');
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
    taxStartModes,
    useDateOptions,
    limitTypes,
    taxCalculationModes,
    isLoading,
    error,
    refetchActions,
  };
}
