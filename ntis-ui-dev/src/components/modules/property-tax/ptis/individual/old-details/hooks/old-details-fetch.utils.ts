import { toast } from 'sonner';

export async function runOnDemandFetch<T>(
  resolvedPropertyId: number | string | null,
  propRef: React.MutableRefObject<number | string | null>,
  setIsLoading: (val: boolean) => void,
  fetchFn: (id: string | number) => Promise<{ success: boolean; data?: T; error?: string }>,
  setData: (data: T) => void,
  errorMsg: string
): Promise<void> {
  if (!resolvedPropertyId || propRef.current === resolvedPropertyId) return;
  propRef.current = resolvedPropertyId;
  setIsLoading(true);
  try {
    const res = await fetchFn(resolvedPropertyId);
    if (res.success && res.data) {
      setData(res.data);
    } else if (res.error) {
      toast.error(res.error);
    }
  } catch {
    toast.error(errorMsg);
  } finally {
    setIsLoading(false);
  }
}
