import { useCallback, useState } from 'react';
import { getLeaseRentDemandsAction } from '@/app/[locale]/assets/revenue/payment/actions';
import type { DemandSimulationResult } from '@/types/asset/revenue/payment/leaseRentPayment.types';

interface UseLeaseRentDemandsState {
  data: DemandSimulationResult | null;
  isLoading: boolean;
  error: string | null;
}

interface UseLeaseRentDemandsResult extends UseLeaseRentDemandsState {
  refetch: () => Promise<void>;
}

/**
 * Fetches the Lease Rent Demand master table for a given lease id via a server action.
 *
 * The shape of the response is a flat list of period rows with the columns
 * `month`, `rent`, `penalty`, `gst` and `total`. This hook is consumed by the
 * Make Payment period drawer to render a master-table view and allow the
 * user to select one or more periods for the upcoming payment.
 */
const demandCacheMap = new Map<string, DemandSimulationResult>();

export function useLeaseRentDemands(
  leaseId: number | string | null | undefined,
  paymentDate?: string,
  financeYear?: number | string | null,
  initialData?: DemandSimulationResult | null
): UseLeaseRentDemandsResult {
  const cacheKey = leaseId ? `${leaseId}_${paymentDate || ''}_${financeYear || ''}` : '';

  if (initialData && cacheKey && !demandCacheMap.has(cacheKey)) {
    demandCacheMap.set(cacheKey, initialData);
  }

  const [state, setState] = useState<UseLeaseRentDemandsState>(() => {
    if (cacheKey && demandCacheMap.has(cacheKey)) {
      return { data: demandCacheMap.get(cacheKey)!, isLoading: false, error: null };
    }
    if (initialData) {
      return { data: initialData, isLoading: false, error: null };
    }
    return { data: null, isLoading: false, error: null };
  });

  const fetchDemands = useCallback(async (bypassCache = false) => {
    if (leaseId == null || leaseId === '' || leaseId === 0 || leaseId === '0') {
      setState({ data: null, isLoading: false, error: null });
      return;
    }

    const currentKey = `${leaseId}_${paymentDate || ''}_${financeYear || ''}`;
    if (!bypassCache && demandCacheMap.has(currentKey)) {
      setState({ data: demandCacheMap.get(currentKey)!, isLoading: false, error: null });
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    const result = await getLeaseRentDemandsAction(
      leaseId,
      financeYear ?? undefined,
      paymentDate
    );

    if (!result.success) {
      setState({
        data: null,
        isLoading: false,
        error: result.error || 'Failed to fetch lease rent demands.',
      });
      return;
    }

    if (result.data) {
      demandCacheMap.set(currentKey, result.data);
    }
    setState({ data: result.data ?? null, isLoading: false, error: null });
  }, [leaseId, financeYear, paymentDate]);


  const refetch = useCallback(async () => {
    if (leaseId != null) {
      const cacheKey = `${leaseId}_${paymentDate || ''}_${financeYear || ''}`;
      demandCacheMap.delete(cacheKey);
    }
    await fetchDemands(true);
  }, [fetchDemands, leaseId, paymentDate, financeYear]);

  return { ...state, refetch };
}
