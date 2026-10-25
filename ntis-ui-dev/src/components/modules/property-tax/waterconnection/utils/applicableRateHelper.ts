import type { WaterRateMasterLookup } from "@/types/water-connection.types";

export function findApplicableRate(
  typeId: number | '',
  sizeId: number | '',
  rateMasters: WaterRateMasterLookup[],
  rateType: string = "yearly"
): { rate: number | null; notFound: boolean } {
  if (!typeId || !sizeId) return { rate: null, notFound: false };

  const matches = rateMasters.filter(
    (r) =>
      r.waterConnectionTypeId === Number(typeId) &&
      r.waterConnectionSizeId === Number(sizeId) &&
      r.isActive === true
  );

  if (!matches.length) return { rate: null, notFound: true };

  // Pick the entry with the most recent finance year
  const best = matches.reduce((prev, cur) =>
    cur.financeYearId > prev.financeYearId ? cur : prev
  );

  let selectedRate: number | null | undefined = best.yearlyRate;
  if (rateType === "monthly") {
    selectedRate = best.monthlyRate;
  } else if (rateType === "quarterly") {
    selectedRate = best.quarterlyRate;
  }

  const rateValue = selectedRate != null && Number(selectedRate) > 0 ? Number(selectedRate) : null;
  return { rate: rateValue, notFound: rateValue == null };
}

export function resolveRateType(
  category?: string | null,
  typeId?: number | '',
  sizeId?: number | '',
  rateMasters?: WaterRateMasterLookup[]
): "yearly" | "quarterly" | "monthly" {
  if (category) {
    const lower = category.toLowerCase().trim();
    if (lower === "quarterly") return "quarterly";
    if (lower === "monthly") return "monthly";
    if (lower === "yearly") return "yearly";
  }

  if (typeId && sizeId && rateMasters && rateMasters.length > 0) {
    const matches = rateMasters.filter(
      (r) =>
        r.waterConnectionTypeId === Number(typeId) &&
        r.waterConnectionSizeId === Number(sizeId) &&
        r.isActive === true
    );
    if (matches.length > 0) {
      const best = matches.reduce((prev, cur) =>
        cur.financeYearId > prev.financeYearId ? cur : prev
      );
      if (best.monthlyRate && Number(best.monthlyRate) > 0 && (!best.yearlyRate || Number(best.yearlyRate) === 0)) {
        return "monthly";
      }
      if (best.quarterlyRate && Number(best.quarterlyRate) > 0 && (!best.yearlyRate || Number(best.yearlyRate) === 0)) {
        return "quarterly";
      }
    }
  }

  return "yearly";
}
