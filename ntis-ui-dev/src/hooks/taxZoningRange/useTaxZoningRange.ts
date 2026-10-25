"use client";

import { useCallback, useMemo, useState } from "react";
import { useLocale } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import {
  TaxZone,
  TaxZoningRange,
  TaxZoningRangeFormModel,
  Ward,
} from "@/types/taxZoningRange.types";
import { DESCRIPTION_SANITIZE } from "@/lib/utils/validation-rules";

/** Lexicographic/natural compare, mirroring the backend's natural-sort property-number matching. */
export function comparePropertyNo(a: string, b: string): number {
  const numA = Number(a);
  const numB = Number(b);
  if (!isNaN(numA) && !isNaN(numB) && numA.toString() === a && numB.toString() === b) {
    return numA - numB;
  }
  return a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });
}

const emptyForm: TaxZoningRangeFormModel = {
  wardIds: [],
  taxZoneId: "",
  assignEntireWard: false,
  fromPropertyNo: "",
  toPropertyNo: "",
  zoneDescription: "",
};

/**
 * Form-state hook for the Add/Update Zoning Range drawer.
 * Handles ward multi-select, property-range fields (hidden for multi-ward), zone selection,
 * description length validation (15-200 chars), and the submitted gate.
 */
export function useTaxZoningRangeForm(initial?: TaxZoningRange | null) {
  const [form, setForm] = useState<TaxZoningRangeFormModel>(() =>
    initial
      ? {
          id: initial.id,
          wardIds: [initial.wardId],
          taxZoneId: initial.taxZoneId,
          assignEntireWard: initial.assignEntireWard,
          fromPropertyNo: initial.fromPropertyNo || "",
          toPropertyNo: initial.toPropertyNo || "",
          zoneDescription: initial.zoneDescription,
        }
      : emptyForm
  );
  const [submitted, setSubmitted] = useState(false);

  const isMultiWard = form.wardIds.length > 1;

  const setWardIds = useCallback((ids: number[]) => {
    setForm((f) => ({ ...f, wardIds: ids }));
  }, []);

  const setTaxZoneId = useCallback((id: number | "") => {
    setForm((f) => ({ ...f, taxZoneId: id }));
  }, []);

  const setFromPropertyNo = useCallback((val: string) => {
    setForm((f) => ({ ...f, fromPropertyNo: val, assignEntireWard: false }));
  }, []);

  const setToPropertyNo = useCallback((val: string) => {
    setForm((f) => ({ ...f, toPropertyNo: val, assignEntireWard: false }));
  }, []);

  const setZoneDescription = useCallback((val: string) => {
    setForm((f) => ({ ...f, zoneDescription: val.replace(DESCRIPTION_SANITIZE, "") }));
  }, []);

  const resetForm = useCallback(() => {
    setForm(emptyForm);
    setSubmitted(false);
  }, []);

  const isWardValid = form.wardIds.length > 0;
  const isZoneValid = form.taxZoneId !== "" && form.taxZoneId !== 0;
  const isDescriptionValid =
    form.zoneDescription.trim().length >= 15 && form.zoneDescription.trim().length <= 200;
  const isRangeValid =
    isMultiWard ||
    (!!form.fromPropertyNo &&
      !!form.toPropertyNo &&
      comparePropertyNo(form.fromPropertyNo, form.toPropertyNo) <= 0);

  const isFormValid = isWardValid && isZoneValid && isDescriptionValid && isRangeValid;

  return {
    form,
    setWardIds,
    setTaxZoneId,
    setFromPropertyNo,
    setToPropertyNo,
    setZoneDescription,
    resetForm,
    submitted,
    setSubmitted,
    isMultiWard,
    isWardValid,
    isZoneValid,
    isDescriptionValid,
    isRangeValid,
    isFormValid,
  };
}

export interface TaxZoningRangeFilters {
  wardId?: number;
  fromPropertyNo?: string;
  toPropertyNo?: string;
  taxZoneId?: number;
  search?: string;
}

/**
 * Table filter/pagination state for the "View Tax Zoning Records" panel, synced to the URL
 * (same convention as `zone-master`'s filter-drives-URL approach).
 */
export function useTaxZoningRangeFilters(initial: {
  pageNumber: number;
  pageSize: number;
  filters: TaxZoningRangeFilters;
}) {
  const router = useRouter();
  const locale = useLocale();
  const searchParams = useSearchParams();
  const basePath = `/${locale}/property-tax/taxzoningmaster`;

  const [filterWard, setFilterWard] = useState(initial.filters.wardId ? String(initial.filters.wardId) : "");
  const [filterFrom, setFilterFrom] = useState(initial.filters.fromPropertyNo || "");
  const [filterTo, setFilterTo] = useState(initial.filters.toPropertyNo || "");
  const [filterZone, setFilterZone] = useState(initial.filters.taxZoneId ? String(initial.filters.taxZoneId) : "");
  const [search, setSearch] = useState(initial.filters.search || "");

  const navigate = useCallback(
    (params: URLSearchParams) => {
      router.push(`${basePath}?${params.toString()}`);
    },
    [router, basePath]
  );

  const handleApplyFilters = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    if (filterWard) params.set("wardId", filterWard); else params.delete("wardId");
    if (filterFrom) params.set("propertyFrom", filterFrom); else params.delete("propertyFrom");
    if (filterTo) params.set("propertyTo", filterTo); else params.delete("propertyTo");
    if (filterZone) params.set("taxZoneId", filterZone); else params.delete("taxZoneId");
    if (search) params.set("search", search); else params.delete("search");
    navigate(params);
  }, [filterWard, filterFrom, filterTo, filterZone, search, searchParams, navigate]);

  const handleClearFilters = useCallback(() => {
    setFilterWard("");
    setFilterFrom("");
    setFilterTo("");
    setFilterZone("");
    setSearch("");
    const params = new URLSearchParams(searchParams.toString());
    ["wardId", "propertyFrom", "propertyTo", "taxZoneId", "search"].forEach((k) => params.delete(k));
    params.set("page", "1");
    navigate(params);
  }, [searchParams, navigate]);

  const changePage = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      navigate(params);
    },
    [searchParams, navigate]
  );

  const changePageSize = useCallback(
    (size: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", "1");
      params.set("pageSize", String(size));
      navigate(params);
    },
    [searchParams, navigate]
  );

  return {
    filterWard,
    setFilterWard,
    filterFrom,
    setFilterFrom,
    filterTo,
    setFilterTo,
    filterZone,
    setFilterZone,
    search,
    setSearch,
    handleApplyFilters,
    handleClearFilters,
    changePage,
    changePageSize,
  };
}

/** Convenience lookup helpers shared by table/form components. */
export function useTaxZoningRangeLookups(wards: Ward[], taxZones: TaxZone[]) {
  const wardOptions = useMemo(
    () => wards.map((w) => ({ label: w.wardNo, value: String(w.id) })),
    [wards]
  );
  const zoneOptions = useMemo(
    () => taxZones.map((z) => ({ label: z.taxZoneNo, value: String(z.id) })),
    [taxZones]
  );
  return { wardOptions, zoneOptions };
}
