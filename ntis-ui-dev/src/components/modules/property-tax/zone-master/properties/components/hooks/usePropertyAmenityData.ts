"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  fetchSocietyDetailsByPropertyAction,
  getSocietyAmenityDetailsAction,
} from "@/app/[locale]/property-tax/zone-master/actions";
import type { SocietyDetailItem } from "@/types/zone-master/properties/societyDetails.types";
import type { SocietyAmenityDetailItem } from "@/types/zone-master/properties/society-amenity-details.types";

interface UsePropertyAmenityDataProps {
  propertyId: string;
}

interface UsePropertyAmenityDataReturn {
  // Wings
  societyDetails: SocietyDetailItem[];
  wings: SocietyDetailItem[];
  wingsLoading: boolean;
  selectedSocietyDetailId: number | null;
  selectedWingId: string;
  setSelectedWingId: (id: string) => void;
  wingOptions: { label: string; value: string }[];
  shouldShowWingDropdown: boolean;
  filteredProperties: SocietyDetailItem[];
  
  // Toggle
  isAmenity: boolean;
  setIsAmenity: (value: boolean) => void;
  
  // Table data
  tableData: SocietyAmenityDetailItem[];
  tableLoading: boolean;
  refreshTable: () => void;
  
  // Selection reset
  resetSelection: () => void;
}

export function usePropertyAmenityData({
  propertyId,
}: UsePropertyAmenityDataProps): UsePropertyAmenityDataReturn {
  // Wings state
  const [societyDetails, setSocietyDetails] = useState<SocietyDetailItem[]>([]);
  const [wingsLoading, setWingsLoading] = useState(false);
  const [selectedWingId, setSelectedWingId] = useState("");

  // Toggle state
  const [isAmenity, setIsAmenity] = useState(false);

  // Table state
  const [tableData, setTableData] = useState<SocietyAmenityDetailItem[]>([]);
  const [tableLoading, setTableLoading] = useState(false);

  const shouldShowWingDropdown = useMemo(() => {
    return societyDetails?.some(
      (item) =>
        item.wingId !== null &&
        item.wingId !== undefined &&
        Number(item.wingId) !== 0
    ) ?? false;
  }, [societyDetails]);

  const filteredProperties = useMemo(() => {
    if (!societyDetails) return [];

    if (!shouldShowWingDropdown) {
      return societyDetails;
    }

    if (!selectedWingId) {
      return [];
    }

    return societyDetails.filter(
      (item) => Number(item.wingId) === Number(selectedWingId)
    );
  }, [societyDetails, shouldShowWingDropdown, selectedWingId]);

  const selectedSocietyDetailId = useMemo(() => {
    return filteredProperties[0]?.id ?? null;
  }, [filteredProperties]);

  // Load wings when property changes
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    setSocietyDetails([]);
    setSelectedWingId("");
    setTableData([]);
    setIsAmenity(false);

    if (!propertyId) return;

    let cancelled = false;
    setWingsLoading(true);

    fetchSocietyDetailsByPropertyAction(Number(propertyId))
      .then((result) => {
        if (cancelled) return;
        setSocietyDetails(result.success && result.data ? result.data.items || [] : []);
      })
      .catch(() => {
        if (!cancelled) setSocietyDetails([]);
      })
      .finally(() => {
        if (!cancelled) setWingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [propertyId]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Load table when wing / toggle changes
  const loadTable = useCallback((sdId: number, amenity: boolean) => {
    setTableLoading(true);

    getSocietyAmenityDetailsAction(sdId, amenity)
      .then((result) => {
        setTableData(result.success && result.data ? result.data : []);
      })
      .catch(() => setTableData([]))
      .finally(() => setTableLoading(false));
  }, []);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!selectedSocietyDetailId) {
      setTableData([]);
      return;
    }
    loadTable(selectedSocietyDetailId, isAmenity);
  }, [selectedSocietyDetailId, isAmenity, loadTable]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const refreshTable = useCallback(() => {
    if (selectedSocietyDetailId) loadTable(selectedSocietyDetailId, isAmenity);
  }, [selectedSocietyDetailId, isAmenity, loadTable]);

  const resetSelection = useCallback(() => {
    // This will be used by parent to reset selection state
  }, []);

  // Wing dropdown options
  const wingOptions = useMemo(() => {
    const seenWingIds = new Set<number>();

    return societyDetails.reduce<{ label: string; value: string }[]>((options, item) => {
      const hasWingId =
        item.wingId !== null &&
        item.wingId !== undefined &&
        Number(item.wingId) !== 0;

      if (!hasWingId) return options;

      const numericWingId = Number(item.wingId);
      if (seenWingIds.has(numericWingId)) return options;
      seenWingIds.add(numericWingId);

      const hasWingName = item.wingName !== null && item.wingName !== undefined && String(item.wingName) !== "null";

      let label = "";
      if (hasWingName) {
        label = `${item.wingId} - ${item.wingName}`;
      } else {
        label = `${item.wingId}`;
      }

      options.push({
        label,
        value: String(item.wingId),
      });

      return options;
    }, []);
  }, [societyDetails]);

  return {
    societyDetails,
    wings: societyDetails,
    wingsLoading,
    selectedSocietyDetailId,
    selectedWingId,
    setSelectedWingId,
    wingOptions,
    shouldShowWingDropdown,
    filteredProperties,
    isAmenity,
    setIsAmenity,
    tableData,
    tableLoading,
    refreshTable,
    resetSelection,
  };
}
