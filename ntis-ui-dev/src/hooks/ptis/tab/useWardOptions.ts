import { useState, useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';
import { getWardListAction } from '@/app/[locale]/property-tax/ptis/actions';
import type { PTISSearchSelectOption as SearchSelectOption } from '@/components/common/PTISSearchSelect';
import type { Ward } from '@/types/ptis.types';

export function useWardOptions(initialWardOptions: SearchSelectOption[]) {
  const t = useTranslations('ptis');
  const [fetchedWardOptions, setFetchedWardOptions] = useState<SearchSelectOption[]>([]);
  const [isFetchingWardOptions, setIsFetchingWardOptions] = useState(false);

  // Combine initial options with any fetched options
  const wardOptions = useMemo(() => {
    if (fetchedWardOptions.length > 0) return fetchedWardOptions;
    return initialWardOptions;
  }, [initialWardOptions, fetchedWardOptions]);

  const handleFetchWardList = useCallback(async () => {
    if (wardOptions.length > 0 || isFetchingWardOptions) return;

    setIsFetchingWardOptions(true);
    try {
      const result = await getWardListAction();
      if (result.success && result.data) {
        const options: SearchSelectOption[] = result.data.map((w: Ward) => ({
          label: w.wardNo || '',
          value: (w.wardId ?? w.wardID ?? '').toString(),
        }));
        setFetchedWardOptions(options);
      } else {
        // ✅ EXPLICIT FAILURE: Handle success:false or missing data
        setFetchedWardOptions([]);
        const errorMsg = result.error || t('search.errors.fetchWardsFailed');
        toast.error(errorMsg);
      }
    } catch (error) {
      // ✅ EXCEPTION SAFETY: Handle network or runtime errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (process.env.NODE_ENV === 'development') {
        console.error('[useWardOptions] Exception fetching wards:', errorMessage);
      }
      setFetchedWardOptions([]);
      toast.error(`${t('search.errors.fetchWardsFailed')} (${errorMessage})`);
    } finally {
      setIsFetchingWardOptions(false);
    }
  }, [wardOptions.length, isFetchingWardOptions, t]);

  return {
    wardOptions,
    isFetchingWardOptions,
    handleFetchWardList,
  };
}
