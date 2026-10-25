"use client";

import { useMemo, useState } from "react";
import { WardZoningAbstractRow } from "@/types/taxZoningRange.types";

export type WardAbstractViewMode = "full" | "total" | "covered" | "pending";

export function useWardAbstract(data: WardZoningAbstractRow[]) {
  const [viewMode, setViewMode] = useState<WardAbstractViewMode>("full");

  const totals = useMemo(() => {
    const totalProperties = data.reduce((s, d) => s + d.totalProperties, 0);
    const coveredProperties = data.reduce((s, d) => s + d.coveredProperties, 0);
    const pendingProperties = data.reduce((s, d) => s + d.pendingProperties, 0);
    const coveragePercent = totalProperties ? (coveredProperties / totalProperties) * 100 : 0;
    return { totalProperties, coveredProperties, pendingProperties, coveragePercent };
  }, [data]);

  const filteredData = useMemo(() => {
    switch (viewMode) {
      case "total":
        return data.filter((d) => d.totalProperties > 0);
      case "covered":
        return data.filter((d) => d.coveredProperties > 0);
      case "pending":
        return data.filter((d) => d.pendingProperties > 0);
      default:
        return data;
    }
  }, [data, viewMode]);

  return { viewMode, setViewMode, totals, filteredData };
}
