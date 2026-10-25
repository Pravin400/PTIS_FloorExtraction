"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import type { ZoneOption, WardOption } from "@/types/asset-masters/user-department-allocation.types";
import { fetchWardsByZoneAction } from "@/app/[locale]/assets/configuration/master-data/user-department-allocation/action";

interface UseAllocationZoneWardStepProps {
  zones: ZoneOption[];
  initialZoneIds: number[];
  initialZoneWards: Record<number, number[]>;
  initialWardsByZone?: Record<number, WardOption[]>;
  initialZoneId?: number | null;
  open: boolean;
  currentStep: 1 | 2 | 3;
  onZoneChange?: (zoneId: number) => void;
  onZoneSelectionChange?: () => void;
}

export function useAllocationZoneWardStep({
  zones,
  initialZoneIds,
  initialZoneWards,
  initialWardsByZone,
  initialZoneId,
  open,
  currentStep,
  onZoneChange,
  onZoneSelectionChange,
}: UseAllocationZoneWardStepProps) {
  const [selectedZoneIds, setSelectedZoneIds] = useState<number[]>(initialZoneIds);
  const [selectedZoneWards, setSelectedZoneWards] = useState<Record<number, number[]>>(initialZoneWards);
  const [allocationMode, setAllocationMode] = useState<"ZONE" | "WARD">("WARD");
  const [wardsByZone, setWardsByZone] = useState<Record<number, WardOption[]>>(initialWardsByZone ?? {});
  const [loadingWardsZoneId, setLoadingWardsZoneId] = useState<number | null>(null);
  const [zoneSearch, setZoneSearch] = useState("");
  const [wardSearch, setWardSearch] = useState("");
  const inFlightRef = useRef<Set<number>>(new Set());

  const [activeWardZoneId, setActiveWardZoneId] = useState<number | null>(() => {
    if (initialZoneId && initialZoneId > 0) return initialZoneId;
    const initialWithWards = Object.keys(initialZoneWards).map(Number).find((id) => id > 0);
    if (initialWithWards) return initialWithWards;
    if (initialZoneIds.length > 0) return initialZoneIds[0];
    return zones.length > 0 ? zones[0].id : null;
  });

  const loadWardsForZone = useCallback(async (zoneId: number) => {
    const zid = Number(zoneId);
    if (!zid) return;
    if (inFlightRef.current.has(zid)) {
      return;
    }
    inFlightRef.current.add(zid);
    setLoadingWardsZoneId(zid);
    try {
      const fetchedWards = await fetchWardsByZoneAction(zid);
      setWardsByZone((prev) => ({ ...prev, [zid]: fetchedWards }));
    } catch {
      setWardsByZone((prev) => ({ ...prev, [zid]: [] }));
    } finally {
      inFlightRef.current.delete(zid);
      setLoadingWardsZoneId((current) => (current === zid ? null : current));
    }
  }, []);

  // Automatically ensure wards are loaded when Step 2 is active
  useEffect(() => {
    if (open && currentStep === 2 && activeWardZoneId) {
      const zid = Number(activeWardZoneId);
      if (zid && !inFlightRef.current.has(zid)) {
        loadWardsForZone(zid);
      }
    }
  }, [open, currentStep, activeWardZoneId, loadWardsForZone]);

  const filteredZones = useMemo(() => {
    const activeZones = (zones || []).filter((z) => z.isActive !== false);
    if (!zoneSearch.trim()) return activeZones;
    const q = zoneSearch.toLowerCase().trim();
    return activeZones.filter(
      (z) =>
        z.zoneNo.toLowerCase().includes(q) ||
        (z.description && z.description.toLowerCase().includes(q))
    );
  }, [zones, zoneSearch]);

  const activeZoneWards = useMemo(() => {
    if (!activeWardZoneId) return [];
    return wardsByZone[activeWardZoneId] || [];
  }, [activeWardZoneId, wardsByZone]);

  const filteredActiveZoneWards = useMemo(() => {
    if (!wardSearch.trim()) return activeZoneWards;
    const q = wardSearch.toLowerCase().trim();
    return activeZoneWards.filter(
      (w) =>
        w.wardNo.toLowerCase().includes(q) ||
        (w.description && w.description.toLowerCase().includes(q))
    );
  }, [activeZoneWards, wardSearch]);

  const isLoadingWards = useMemo(() => {
    if (!open || currentStep !== 2 || !activeWardZoneId) return false;
    const zid = Number(activeWardZoneId);
    if (!zid) return false;
    if (loadingWardsZoneId === zid) return true;
    return wardsByZone[zid] === undefined;
  }, [open, currentStep, activeWardZoneId, loadingWardsZoneId, wardsByZone]);

  const totalSelectedWardsCount = useMemo(() => {
    let count = 0;
    for (const wards of Object.values(selectedZoneWards)) {
      if (Array.isArray(wards)) count += wards.length;
      else if (typeof wards === "number" && wards > 0) count += 1;
    }
    return count;
  }, [selectedZoneWards]);

  const configuredZoneCount = useMemo(() => {
    let count = 0;
    for (const wards of Object.values(selectedZoneWards)) {
      if (Array.isArray(wards) && wards.length > 0) count += 1;
      else if (typeof wards === "number" && wards > 0) count += 1;
    }
    return count;
  }, [selectedZoneWards]);

  const handleSelectActiveWardZone = useCallback((zoneId: number) => {
    const zid = Number(zoneId);
    setActiveWardZoneId(zid);
    onZoneChange?.(zid);
    loadWardsForZone(zid);
  }, [onZoneChange, loadWardsForZone]);

  const handleModeChange = useCallback((mode: "ZONE" | "WARD") => {
    setAllocationMode(mode);
    if (mode === "WARD") {
      const targetZoneId =
        activeWardZoneId ?? (selectedZoneIds[0] || (zones.length > 0 ? zones[0].id : null));
      if (targetZoneId) {
        setActiveWardZoneId(targetZoneId);
        onZoneChange?.(targetZoneId);
      }
    }
  }, [activeWardZoneId, selectedZoneIds, zones, onZoneChange]);

  const toggleWardSelection = useCallback((zoneId: number, wardId: number) => {
    const zid = Number(zoneId);
    const wid = Number(wardId);
    if (!zid || !wid) return;

    setSelectedZoneWards((prev) => {
      const currentWards = prev[zid] || [];
      const isSelected = currentWards.includes(wid);
      const updated = isSelected
        ? currentWards.filter((id) => id !== wid)
        : [...currentWards, wid];
      return {
        ...prev,
        [zid]: updated,
      };
    });
  }, []);

  const selectAllWardsForZone = useCallback((zoneId: number) => {
    const zid = Number(zoneId);
    const wardsToSelect =
      activeWardZoneId === zid ? filteredActiveZoneWards : (wardsByZone[zid] || []);
    if (wardsToSelect.length === 0) return;
    const newIds = wardsToSelect.map((w) => Number(w.id)).filter((id) => id > 0);
    setSelectedZoneWards((prev) => {
      const current = prev[zid] || [];
      return {
        ...prev,
        [zid]: Array.from(new Set([...current, ...newIds])),
      };
    });
  }, [activeWardZoneId, filteredActiveZoneWards, wardsByZone]);

  const clearWardsForZone = useCallback((zoneId: number) => {
    const zid = Number(zoneId);
    setSelectedZoneWards((prev) => ({
      ...prev,
      [zid]: [],
    }));
  }, []);

  const toggleZone = useCallback((zoneId: number) => {
    onZoneSelectionChange?.();
    const n = Number(zoneId);
    setSelectedZoneIds((prev) =>
      prev.some((id) => Number(id) === n)
        ? prev.filter((id) => Number(id) !== n)
        : [...prev, n]
    );
  }, [onZoneSelectionChange]);

  const selectAllZones = useCallback(() => {
    setSelectedZoneIds(filteredZones.map((z) => Number(z.id)));
  }, [filteredZones]);

  const clearAllZones = useCallback(() => {
    setSelectedZoneIds([]);
  }, []);

  const resetZoneWards = useCallback((
    newZoneIds: number[],
    newZoneWards: Record<number, number[]>,
    newWardsByZone: Record<number, WardOption[]>,
    targetZid: number | null
  ) => {
    inFlightRef.current.clear();
    setSelectedZoneIds(newZoneIds);
    setSelectedZoneWards(newZoneWards);
    setWardsByZone(newWardsByZone);
    setActiveWardZoneId(targetZid);
    setZoneSearch("");
    setWardSearch("");
    setAllocationMode("WARD");
  }, []);

  return {
    selectedZoneIds,
    setSelectedZoneIds,
    selectedZoneWards,
    setSelectedZoneWards,
    allocationMode,
    setAllocationMode: handleModeChange,
    wardsByZone,
    setWardsByZone,
    activeWardZoneId,
    setActiveWardZoneId: handleSelectActiveWardZone,
    loadingWardsZoneId,
    isLoadingWards,
    zoneSearch,
    setZoneSearch,
    wardSearch,
    setWardSearch,
    filteredZones,
    activeZoneWards,
    filteredActiveZoneWards,
    totalSelectedWardsCount,
    configuredZoneCount,
    loadWardsForZone,
    handleSelectZoneWard: toggleWardSelection,
    toggleWardSelection,
    selectAllWardsForZone,
    clearWardsForZone,
    toggleZone,
    selectAllZones,
    clearAllZones,
    resetZoneWards,
  };
}
