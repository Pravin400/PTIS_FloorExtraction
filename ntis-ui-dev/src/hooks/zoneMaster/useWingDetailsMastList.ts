import { useEffect, useCallback } from "react";
import { WingDetailsMastItem } from "@/types/zone-master/properties/wingDetailsMast.types";
import { getWingDetailsMastBySocietyDetailsMastIdAction } from "@/app/[locale]/property-tax/zone-master/actions";

interface UseWingDetailsMastListProps {
  /** The property's single SocietyDetailsMast id (null/undefined if none exists yet) */
  societyDetailsMastId: number | null | undefined;
  setWingDetailsMast: React.Dispatch<React.SetStateAction<WingDetailsMastItem[]>>;
}

/**
 * Fetches WingDetailsMast (wing) records for a property's SocietyDetailsMast
 * record. If no SocietyDetailsMast exists yet (property has no wings created
 * yet), the list is simply empty - no fetch is made.
 */
export function useWingDetailsMastList({ societyDetailsMastId, setWingDetailsMast }: UseWingDetailsMastListProps) {
  const fetchWingDetailsMast = useCallback(async () => {
    if (!societyDetailsMastId || societyDetailsMastId <= 0) {
      setWingDetailsMast([]);
      return;
    }

    const result = await getWingDetailsMastBySocietyDetailsMastIdAction(societyDetailsMastId);
    if (result.success && result.data) {
      setWingDetailsMast(result.data.wingDetailsMast ?? []);
    } else {
      setWingDetailsMast([]);
    }
  }, [societyDetailsMastId, setWingDetailsMast]);

  useEffect(() => {
    fetchWingDetailsMast();
  }, [fetchWingDetailsMast]);

  return { refetchWingDetailsMast: fetchWingDetailsMast };
}
