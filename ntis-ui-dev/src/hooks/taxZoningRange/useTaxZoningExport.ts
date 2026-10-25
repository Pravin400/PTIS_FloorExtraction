"use client";

import { useState, useCallback } from "react";
import { useLocale } from "next-intl";
import { toast } from "sonner";
import { downloadTaxZoningExport } from "@/lib/api/taxZoningRange/taxZoningRange-export.client";

export interface ExportFilters {
  wardId?: number;
  taxZoneId?: number;
  fromPropertyNo?: string;
  toPropertyNo?: string;
  searchTerm?: string;
  ulbName?: string;
}

export function useTaxZoningExport(
  filters: ExportFilters,
  _isFiltered: boolean,
  t: (key: string) => string
) {
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPending, setIsExportingPending] = useState(false);
  const locale = useLocale();

  const handleExportExcel = useCallback(() => {
    setIsExportingExcel(true);
    try {
      const params: Record<string, string> = { locale };
      if (filters.wardId) params.WardId = String(filters.wardId);
      if (filters.taxZoneId) params.TaxZoneId = String(filters.taxZoneId);
      if (filters.fromPropertyNo) params.PropertyNo = filters.fromPropertyNo;
      if (filters.searchTerm) params.SearchTerm = filters.searchTerm;
      if (filters.ulbName) params.ulbName = filters.ulbName;

      toast.info(t("messages.exportDownloading"));
      downloadTaxZoningExport("ranges-excel", params);
    } finally {
      setIsExportingExcel(false);
    }
  }, [filters, locale, t]);

  const handleExportPending = useCallback(() => {
    setIsExportingPending(true);
    try {
      const params: Record<string, string> = {};
      if (filters.wardId) params.wardId = String(filters.wardId);

      toast.info(t("messages.exportDownloading"));
      downloadTaxZoningExport("pending-excel", Object.keys(params).length ? params : undefined);
    } finally {
      setIsExportingPending(false);
    }
  }, [filters.wardId, t]);

  return { isExportingExcel, handleExportExcel, isExportingPending, handleExportPending };
}
