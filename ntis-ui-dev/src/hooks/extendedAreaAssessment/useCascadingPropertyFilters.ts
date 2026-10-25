"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import type { useTranslations } from "next-intl";
import {
  getWardsDropdownAction,
  getPropertyOptionsByWardAction,
  type WardDropdownOption,
  type WardPropertyOptionDto,
} from "@/app/[locale]/property-tax/extended-area-assesment/single-assessment/action";
import { buildWardOptions, buildWardPropertyOptions } from "./buildCascadingOptions";

export interface UseCascadingPropertyFiltersOptions {
  t: ReturnType<typeof useTranslations>;
  initialWardId?: string;
  /** The resolved property's id (as a string) — binds the combined Property No dropdown, which
   *  covers both plain properties and their partitions in one list (see `buildWardPropertyOptions`). */
  initialPropertyId?: string;
  initialWards?: WardDropdownOption[];
  initialWardProperties?: WardPropertyOptionDto[];
  /** Called with the resolved UPIC once a property/partition is picked, so the caller can trigger its own search. */
  onPropertyResolved: (upic: string) => void;
}

/** Owns the Ward -> Property No (combined property + partition) cascading dropdown state
 *  (URL-synced), used by the single-assessment screen's property-identification section. */
export function useCascadingPropertyFilters({
  t,
  initialWardId = "",
  initialPropertyId = "",
  initialWards = [],
  initialWardProperties = [],
  onPropertyResolved,
}: UseCascadingPropertyFiltersOptions) {
  const searchParams = useSearchParams();

  const [wards, setWards] = useState<WardDropdownOption[]>(initialWards);
  const [selectedWardId, setSelectedWardId] = useState<string>(initialWardId || searchParams.get("wardId") || "");
  const [isLoadingWards, setIsLoadingWards] = useState<boolean>(false);

  const [wardProperties, setWardProperties] = useState<WardPropertyOptionDto[]>(initialWardProperties);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>(initialPropertyId || searchParams.get("propertyId") || "");
  const [isLoadingProperties, setIsLoadingProperties] = useState<boolean>(false);

  // Sync props from server navigation / searchParams updates
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (initialWards && initialWards.length > 0) setWards(initialWards);
    if (initialWardId) setSelectedWardId(initialWardId);
    if (initialPropertyId) setSelectedPropertyId(initialPropertyId);
    if (initialWardProperties && initialWardProperties.length > 0) setWardProperties(initialWardProperties);
  }, [initialWards, initialWardId, initialPropertyId, initialWardProperties]);

  // Fallback Wards fetch if initialWards was empty
  useEffect(() => {
    if (wards.length === 0) {
      let isMounted = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingWards(true);
      getWardsDropdownAction()
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setWards(res.data);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingWards(false);
        });
      return () => {
        isMounted = false;
      };
    }
  }, [wards.length]);

  // Fallback properties fetch if a ward is already selected (e.g. from a URL/search-resolved
  // initial state) but initialWardProperties wasn't provided/was empty.
  useEffect(() => {
    if (selectedWardId && wardProperties.length === 0) {
      const wardIdNum = Number(selectedWardId);
      if (!wardIdNum) return;
      let isMounted = true;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsLoadingProperties(true);
      getPropertyOptionsByWardAction(wardIdNum)
        .then((res) => {
          if (isMounted && res.success && res.data) {
            setWardProperties(res.data);
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingProperties(false);
        });
      return () => {
        isMounted = false;
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedWardId]);

  // Ward/Property No selection only updates local state (and, for Property No, the resolved UPIC
  // used for display) — it must NOT navigate/push query params or trigger a schedule fetch by
  // itself. Changing the dropdowns is just "picking a value"; the actual search only happens when
  // the officer clicks the "Search property" button (see PropertyIdentificationSection's
  // `onSearchAny`, which searches using whatever UPIC/Old GP Number is currently in the form).
  const handleWardChange = async (wardIdStr: string) => {
    setSelectedWardId(wardIdStr);
    setSelectedPropertyId("");
    setWardProperties([]);

    if (!wardIdStr) return;
    const wardIdNum = Number(wardIdStr);
    if (!wardIdNum) return;

    setIsLoadingProperties(true);
    try {
      const res = await getPropertyOptionsByWardAction(wardIdNum);
      if (res.success && res.data) {
        setWardProperties(res.data);
      }
    } finally {
      setIsLoadingProperties(false);
    }
  };

  const handlePropertyChange = (propertyIdStr: string) => {
    setSelectedPropertyId(propertyIdStr);

    const matched = wardProperties.find((item) => String(item.propertyId) === propertyIdStr);
    const resolvedUpic = matched?.upicId || "";

    if (resolvedUpic) {
      onPropertyResolved(resolvedUpic);
    }
  };

  /** Clears the Ward/Property No selections and their fetched option lists — local state only;
   *  the caller is responsible for also clearing the matching URL params (e.g. the search Reset
   *  flow already does this via `handleReset`). */
  const resetFilters = () => {
    setSelectedWardId("");
    setWardProperties([]);
    setSelectedPropertyId("");
  };

  const wardOptions = buildWardOptions(wards, isLoadingWards, t);
  const propertyOptions = buildWardPropertyOptions(wardProperties, selectedWardId, isLoadingProperties, t);

  return {
    selectedWardId,
    isLoadingWards,
    selectedPropertyId,
    isLoadingProperties,
    wardOptions,
    propertyOptions,
    handleWardChange,
    handlePropertyChange,
    resetFilters,
  };
}

export type UseCascadingPropertyFilters = ReturnType<typeof useCascadingPropertyFilters>;
