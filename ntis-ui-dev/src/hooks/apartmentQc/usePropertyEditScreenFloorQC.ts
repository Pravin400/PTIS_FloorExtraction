import { useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { logger } from "@/lib/utils/logger";
import { fetchFloorQCByPropertyIdSafeAction } from "@/app/[locale]/property-tax/ptis/appartmentQC/action";
import type { ApartmentQCDetail } from "@/types/apartmentQC.types";
import {
  DrawerFloorDataRow,
  DrawerDropdownOption,
  DrawerSubTypeOption,
} from "../../types/propertyEditScreenDrawer.types";

interface UsePropertyEditScreenFloorQCArgs {
  open: boolean;
  propertyData?: ApartmentQCDetail | null;
  subTabProp?: string;
  initialFloorQCData?: ApartmentQCDetail[];
  setFloorData: React.Dispatch<React.SetStateAction<DrawerFloorDataRow[]>>;
  setIsLoadingFloorQCData: React.Dispatch<React.SetStateAction<boolean>>;
  setPrePopulatedFloors: React.Dispatch<React.SetStateAction<DrawerDropdownOption[]>>;
  setPrePopulatedConstTypes: React.Dispatch<React.SetStateAction<DrawerDropdownOption[]>>;
  setPrePopulatedUseTypes: React.Dispatch<React.SetStateAction<DrawerDropdownOption[]>>;
  setPrePopulatedSubTypes: React.Dispatch<React.SetStateAction<DrawerDropdownOption[]>>;
  floorDataInitializedRef: React.MutableRefObject<boolean>;
  prevFloorQCParamsRef: React.MutableRefObject<{ propertyId: number | null; type: string }>;
  // Loaded master options — used to sync row text values to master IDs (dedup fix)
  loadedFloorOptions: DrawerDropdownOption[];
  loadedConTypeOptions: DrawerDropdownOption[];
  loadedUseTypeOptions: DrawerDropdownOption[];
  loadedSubTypeOptions: DrawerSubTypeOption[];
}

const createEmptyFloorRow = (): DrawerFloorDataRow => ({
  id: "row-1",
  pdnId: null,
  floorId: "",
  conYear: "",
  asstYear: "",
  constructionTypeId: "",
  typeOfUseId: "",
  subTypeOfUseId: "",
  noOfRooms: "",
  area: "",
  rentMY: "",
  rateMY: "",
  rentalValue: "",
  depreciation: "",
  alv: "",
  mr: "",
  rv: "",
  sdrr: "",
  baseValue: "",
  floorFactor: "",
  ageFactor: "",
  ntbFactor: "",
  useFactor: "",
  capitalValue: "",
});

/**
 * Hook for managing Floor QC data fetching and transformation
 * Supports SSR-provided initialFloorQCData to eliminate client-side fetching
 */
export function usePropertyEditScreenFloorQC({
  open,
  propertyData,
  subTabProp = "rateable",
  initialFloorQCData,
  setFloorData,
  setIsLoadingFloorQCData,
  setPrePopulatedFloors,
  setPrePopulatedConstTypes,
  setPrePopulatedUseTypes,
  setPrePopulatedSubTypes,
  floorDataInitializedRef,
  prevFloorQCParamsRef,
  loadedFloorOptions,
  loadedConTypeOptions,
  loadedUseTypeOptions,
  loadedSubTypeOptions,
}: UsePropertyEditScreenFloorQCArgs) {
  const searchParams = useSearchParams();
  const subTab = searchParams.get("subTab") || subTabProp;
  const ssrDataUsedRef = useRef(false);

  // Reset Floor QC data when propertyData changes
  useEffect(() => {
    const currentPropertyId = propertyData?.id;
    const prevPropertyId = prevFloorQCParamsRef.current.propertyId;

    if (!currentPropertyId && prevPropertyId !== null) {
      setFloorData([]);
      setPrePopulatedFloors([]);
      setPrePopulatedConstTypes([]);
      setPrePopulatedUseTypes([]);
      setPrePopulatedSubTypes([]);
      floorDataInitializedRef.current = false;
      prevFloorQCParamsRef.current = { propertyId: null, type: "" };
      return;
    }

    if (currentPropertyId && prevPropertyId !== null && prevPropertyId !== currentPropertyId) {
      setFloorData([]);
      setPrePopulatedFloors([]);
      setPrePopulatedConstTypes([]);
      setPrePopulatedUseTypes([]);
      setPrePopulatedSubTypes([]);
      floorDataInitializedRef.current = false;
    }
  }, [propertyData?.id, setFloorData, setPrePopulatedFloors, setPrePopulatedConstTypes, setPrePopulatedUseTypes, setPrePopulatedSubTypes, floorDataInitializedRef, prevFloorQCParamsRef]);

  // Helper function to process floor QC data (shared by SSR and client-side fetch)
  const processFloorQCData = useCallback((result: ApartmentQCDetail[]) => {
    if (result && result.length > 0) {
      const mappedFloorData: DrawerFloorDataRow[] = result.map((item, index) => ({
        id: `row-${item.pdnId || index + 1}`,
        pdnId: item.pdnId || null,
        floorId: String(item.floor || ""),
        conYear: String(item.constructionYear || ""),
        asstYear: String(item.assessmentYear || ""),
        constructionTypeId: String(item.constructionType || ""),
        typeOfUseId: String(item.typeOfUse || ""),
        subTypeOfUseId: String(item.subTypeOfUse || ""),
        noOfRooms: String(item.noOfRooms ?? ""),
        area: String(item.carpetASqMtr || item.builtupASqMtr || ""),
        rentMY: String(item.rentMonthly || ""),
        rateMY: String(item.monthlyRate || ""),
        monthlyRate: item.monthlyRate,
        yearlyRate: item.yearlyRate,
        rentalValue: String(item.annualRentalValue || ""),
        depreciation: String(item.depreciation || ""),
        alv: String(item.annualRentalValue || ""),
        mr: String(item.maintenance || ""),
        rv: String(item.rateableValue || item.rVorCVValue || ""),
        sdrr: String(item.sdrr || ""),
        baseValue: String(item.baseValue || ""),
        floorFactor: String(item.floorFactor || ""),
        ageFactor: String(item.ageFactor || ""),
        ntbFactor: String(item.natureFactor || ""),
        useFactor: String(item.useFactor || ""),
        capitalValue: String(item.capitalValue || item.rVorCVValue || ""),
      }));

      setFloorData(mappedFloorData);

      // Extract display text values from FloorQC API to show initial selected values
      // These are temporary text-based options until master data loads on dropdown click
      const floorsMap = new Map<string, string>();
      const constTypesMap = new Map<string, string>();
      const useTypesMap = new Map<string, string>();
      const subTypesMap = new Map<string, string>();

      result.forEach((item) => {
        if (item.floor) floorsMap.set(item.floor, item.floor);
        if (item.constructionType) constTypesMap.set(item.constructionType, item.constructionType);
        if (item.typeOfUse) useTypesMap.set(item.typeOfUse, item.typeOfUse);
        if (item.subTypeOfUse) subTypesMap.set(item.subTypeOfUse, item.subTypeOfUse);
      });

      setPrePopulatedFloors(Array.from(floorsMap, ([value, label]) => ({ value, label })));
      setPrePopulatedConstTypes(Array.from(constTypesMap, ([value, label]) => ({ value, label })));
      setPrePopulatedUseTypes(Array.from(useTypesMap, ([value, label]) => ({ value, label })));
      setPrePopulatedSubTypes(Array.from(subTypesMap, ([value, label]) => ({ value, label })));
    } else {
      setFloorData([createEmptyFloorRow()]);
      setPrePopulatedFloors([]);
      setPrePopulatedConstTypes([]);
      setPrePopulatedUseTypes([]);
      setPrePopulatedSubTypes([]);
    }
  }, [setFloorData, setPrePopulatedFloors, setPrePopulatedConstTypes, setPrePopulatedUseTypes, setPrePopulatedSubTypes]);

  // Use SSR-provided floor QC data if available (no client-side fetch needed)
  // This handles both cases: data exists (process it) or empty array (show empty state)
  useEffect(() => {
    // Only process if SSR data was provided (defined, even if empty array)
    if (initialFloorQCData !== undefined && !ssrDataUsedRef.current && open) {
      ssrDataUsedRef.current = true;
      floorDataInitializedRef.current = true;
      const propertyId = propertyData?.id;
      const type = subTab === "dual-method" ? "dual" : subTab;
      prevFloorQCParamsRef.current = { propertyId: propertyId ?? null, type };
      processFloorQCData(initialFloorQCData);
    }
  }, [initialFloorQCData, open, propertyData?.id, subTab, processFloorQCData, floorDataInitializedRef, prevFloorQCParamsRef]);

  // Fetch Floor QC data only when SSR data is not available (undefined = no SSR attempted)
  useEffect(() => {
    // Skip client-side fetch if SSR data was provided (even if empty array)
    // undefined = no SSR attempted, so we should fetch
    // [] = SSR attempted but no data, so skip fetch
    if (initialFloorQCData !== undefined) return;

    const propertyId = propertyData?.id;
    const type = subTab === "dual-method" ? "dual" : subTab;

    if (!propertyId || !open) return;

    const isSameParams =
      prevFloorQCParamsRef.current.propertyId === propertyId &&
      prevFloorQCParamsRef.current.type === type;

    if (isSameParams && floorDataInitializedRef.current) return;

    prevFloorQCParamsRef.current = { propertyId, type };
    floorDataInitializedRef.current = true;
    setIsLoadingFloorQCData(true);

    fetchFloorQCByPropertyIdSafeAction(propertyId, type)
      .then((result) => {
        processFloorQCData(result);
      })
      .catch((error) => {
        logger.error("[Floor QC] Failed to fetch floor data", { error: error as Error });
        toast.error("Failed to load Floor QC data");
        setFloorData([createEmptyFloorRow()]);
      })
      .finally(() => {
        setIsLoadingFloorQCData(false);
      });
  }, [propertyData?.id, subTab, open, initialFloorQCData, processFloorQCData, setFloorData, setIsLoadingFloorQCData, floorDataInitializedRef, prevFloorQCParamsRef]);

  // Update area for a specific row (used by room submission)
  const updateFloorRowArea = useCallback(
    (rowId: string, newArea: string) => {
      setFloorData((prev) =>
        prev.map((row) => (row.id === rowId ? { ...row, area: newArea } : row))
      );
    },
    [setFloorData]
  );

  // Update noOfRooms for a specific row (optimistic update after room submission)
  const updateFloorRowCount = useCallback(
    (rowId: string, newCount: string) => {
      setFloorData((prev) =>
        prev.map((row) =>
          row.id === rowId ? { ...row, noOfRooms: newCount } : row
        )
      );
    },
    [setFloorData]
  );

  // Re-pull Floor QC rows from the backend (e.g. after sync-rooms recomputes
  // aggregates). Reuses the same processing path as the initial fetch so the
  // row mapping + pre-populated dropdown text stay consistent.
  const refetchFloorQC = useCallback(async () => {
    const propertyId = propertyData?.id;
    if (!propertyId) return;
    const type = subTab === "dual-method" ? "dual" : subTab;
    setIsLoadingFloorQCData(true);
    try {
      const result = await fetchFloorQCByPropertyIdSafeAction(propertyId, type);
      processFloorQCData(result);
    } catch (error) {
      logger.error("[Floor QC] Refetch failed", { error: error as Error });
      toast.error("Failed to refresh Floor QC data");
    } finally {
      setIsLoadingFloorQCData(false);
    }
  }, [propertyData?.id, subTab, processFloorQCData, setIsLoadingFloorQCData]);

  // ── Sync row text values → master IDs once master options arrive ───────────
  // Row values from ApartmentQC API are display text (e.g. "पहिला मजला"); master
  // APIs return ID-based options. After this sync, CompactSelect finds an exact
  // value match and stops prepending a duplicate temp entry. Applies to all four
  // dropdown columns (Floor, Con Type, Use, Sub Type) in one pass.
  //
  // Sub-Type rule: never mutate row.subTypeOfUseId unless we confirmed both the
  // row's use type (matchUse) AND the sub-type master is loaded — otherwise the
  // sub-type lookup could surface a same-labelled entry from a different use type.
  const syncedRowsRef = useRef<Set<string>>(new Set());
  const lastSyncLengthsRef = useRef({ f: 0, c: 0, u: 0, s: 0 });
  useEffect(() => {
    const cur = {
      f: loadedFloorOptions.length,
      c: loadedConTypeOptions.length,
      u: loadedUseTypeOptions.length,
      s: loadedSubTypeOptions.length,
    };
    if (cur.f === 0 && cur.c === 0 && cur.u === 0 && cur.s === 0) return;
    const prev = lastSyncLengthsRef.current;
    if (cur.f === prev.f && cur.c === prev.c && cur.u === prev.u && cur.s === prev.s) return;
    lastSyncLengthsRef.current = cur;

    setFloorData((prevRows) => {
      let mutated = false;
      const next = prevRows.map((row) => {
        const key = `${row.id}|F${cur.f}|C${cur.c}|U${cur.u}|S${cur.s}`;
        if (syncedRowsRef.current.has(key)) return row;
        syncedRowsRef.current.add(key);

        const eq = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();
        const matchFloor = loadedFloorOptions.find((o) => eq(o.label, row.floorId));
        const matchCon = loadedConTypeOptions.find((o) => eq(o.label, row.constructionTypeId));
        const matchUse = loadedUseTypeOptions.find((o) => eq(o.label, row.typeOfUseId));

        // Sub-Type: only mutate when we resolved the row's use-type ID AND the
        // sub-type master is loaded AND a sub-type with the same parent ID matches.
        let nextSubTypeOfUseId = row.subTypeOfUseId;
        if (matchUse && loadedSubTypeOptions.length > 0) {
          const matchSub = loadedSubTypeOptions.find(
            (s) => eq(s.label, row.subTypeOfUseId) && s.typeOfUseId === matchUse.value
          );
          if (matchSub) nextSubTypeOfUseId = matchSub.value;
        }

        const updated: DrawerFloorDataRow = {
          ...row,
          floorId: matchFloor?.value ?? row.floorId,
          constructionTypeId: matchCon?.value ?? row.constructionTypeId,
          typeOfUseId: matchUse?.value ?? row.typeOfUseId,
          subTypeOfUseId: nextSubTypeOfUseId,
        };
        if (
          updated.floorId !== row.floorId ||
          updated.constructionTypeId !== row.constructionTypeId ||
          updated.typeOfUseId !== row.typeOfUseId ||
          updated.subTypeOfUseId !== row.subTypeOfUseId
        ) {
          mutated = true;
          return updated;
        }
        return row;
      });
      return mutated ? next : prevRows;
    });
  }, [loadedFloorOptions, loadedConTypeOptions, loadedUseTypeOptions, loadedSubTypeOptions, setFloorData]);

  // Reset the sync cache when the property changes so re-opening a different
  // property triggers a fresh sync.
  useEffect(() => {
    syncedRowsRef.current.clear();
    lastSyncLengthsRef.current = { f: 0, c: 0, u: 0, s: 0 };
  }, [propertyData?.id]);

  return {
    subTab,
    updateFloorRowArea,
    updateFloorRowCount,
    refetchFloorQC,
  };
}
