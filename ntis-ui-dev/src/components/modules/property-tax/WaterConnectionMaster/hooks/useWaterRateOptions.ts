import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  fetchTapTypePagedAction,
  fetchTapSizePagedAction,
  fetchFinancialYearsPagedAction,
} from "@/app/[locale]/property-tax/water-connection-master/actions";

interface UseWaterRateOptionsProps {
  initialTypeId?: number;
  initialSizeId?: number;
  initialYearId?: number;
}

export function useWaterRateOptions({
  initialTypeId,
  initialSizeId,
  initialYearId,
}: UseWaterRateOptionsProps = {}) {
  const [types, setTypes] = useState<{ label: string; value: string }[]>([]);
  const [sizes, setSizes] = useState<{ label: string; value: string }[]>([]);
  const [years, setYears] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOptions() {
      try {
        const [typeRes, sizeRes, yearRes] = await Promise.all([
          fetchTapTypePagedAction(1, 1000),
          fetchTapSizePagedAction(1, 1000),
          fetchFinancialYearsPagedAction(),
        ]);

        setTypes(
          (typeRes.items || [])
            .filter((t) => t.isActive || t.waterConnectionTypeId === initialTypeId)
            .map((t) => ({
              label: t.typeName,
              value: String(t.waterConnectionTypeId),
            }))
        );

        setSizes(
          (sizeRes.items || [])
            .filter((s) => s.isActive || s.waterConnectionSizeId === initialSizeId)
            .map((s) => ({
              label: s.displayLabel || s.sizeName,
              value: String(s.waterConnectionSizeId),
            }))
        );

        setYears(
          (yearRes.items || [])
            .filter((y) => y.isActive || y.id === initialYearId)
            .map((y) => ({
              label: y.yearCode || String(y.year),
              value: String(y.id),
            }))
        );
      } catch {
        toast.error("Failed to load options");
      } finally {
        setLoading(false);
      }
    }
    loadOptions();
  }, [initialTypeId, initialSizeId, initialYearId]);

  return { types, sizes, years, loading };
}
