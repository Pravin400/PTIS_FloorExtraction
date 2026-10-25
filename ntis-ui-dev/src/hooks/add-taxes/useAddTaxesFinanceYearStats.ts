import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { logger } from '@/lib/utils/logger';
import type { InitOperationsResponse, FinanceYearOption } from '@/types/addTaxes.types';

/**
 * Owns Finance Year selection + the dashboard stats/init data it drives — split out of
 * useAddTaxesState.ts verbatim (pure relocation, no logic change) to bring that hook's line count
 * down, per review feedback.
 */
export function useAddTaxesFinanceYearStats(
  initData: InitOperationsResponse | null,
  clientActions: {
    initOperationsAction: (financeYearId?: string | number) => Promise<InitOperationsResponse | null>;
  }
) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const defaultFinanceYearId = initData?.financeYears?.[0]?.value !== undefined ? String(initData.financeYears[0].value) : '';
  const urlFinanceYearId = searchParams.get('financeYearId') || searchParams.get('financeYear');
  const [financeYearId, setFinanceYearId] = useState<string>(urlFinanceYearId || defaultFinanceYearId);

  const [currentInitData, setCurrentInitData] = useState<InitOperationsResponse | null>(initData);
  const [isLoadingInit, setIsLoadingInit] = useState(false);

  // The server component already fetched initOperationsAction() once, for whichever finance year
  // it resolved (initData) — this call is expensive (tens of seconds against the live stats
  // query), so skip re-running it on mount for that SAME year; only fetch again once
  // financeYearId actually changes to a genuinely different year. Seeded to null when initData
  // itself is missing (server fetch failed), so the client still tries once in that case.
  const lastFetchedFinanceYearIdRef = useRef<string | null>(initData ? (financeYearId || null) : null);

  useEffect(() => {
    if (!financeYearId) return;
    if (lastFetchedFinanceYearIdRef.current === financeYearId) return;
    lastFetchedFinanceYearIdRef.current = financeYearId;

    let active = true;
    const fetchInitData = async () => {
      setIsLoadingInit(true);
      try {
        const data = await clientActions.initOperationsAction(financeYearId);
        if (data && active) {
          setCurrentInitData(data);
        }
      } catch (err) {
        logger.error("Failed to load init data for finance year", { error: err as Error });
      } finally {
        if (active) setIsLoadingInit(false);
      }
    };
    fetchInitData();
    return () => {
      active = false;
    };
    // clientActions (actionsProp) gets a new object reference on every server-component
    // re-render — which happens on every router.replace/push this screen does for scope/
    // selection/tab changes — without financeYearId itself changing. Depending on it here would
    // re-trigger this expensive fetch on every such navigation, not just real finance-year
    // changes, which is exactly the "called repeatedly" symptom this effect used to cause.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [financeYearId]);

  const refreshStats = async () => {
    if (!financeYearId) return;
    try {
      const data = await clientActions.initOperationsAction(financeYearId);
      if (data) {
        setCurrentInitData(data);
      }
    } catch (err) {
      logger.error("Failed to load init data for finance year", { error: err as Error });
    }
  };

  const updateUrlParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    if (key === 'financeYearId') {
      params.delete('financeYear');
    }
    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const handleFinanceYearChange = (val: string) => {
    setFinanceYearId(val);
    updateUrlParams('financeYearId', val);
  };

  const stats = currentInitData?.summary || {
    totalProperties: 0,
    transmastProperties: 0,
    eligibleRecords: 0,
    skippedRecords: 0,
    runningJobs: 0
  };

  const permissions = currentInitData?.permissions || {};
  const financeYearOptions = currentInitData?.financeYears || ([] as FinanceYearOption[]);

  const selectedFyOption = financeYearOptions.find(opt => String(opt.value) === String(financeYearId));
  const isFinanceYearActive = selectedFyOption ? selectedFyOption.isActive !== false : true;
  const financeYearLabel = selectedFyOption ? selectedFyOption.label : '';

  return {
    financeYearId,
    defaultFinanceYearId,
    handleFinanceYearChange,
    isLoadingInit,
    refreshStats,
    stats,
    permissions,
    financeYearOptions,
    isFinanceYearActive,
    financeYearLabel,
  };
}
