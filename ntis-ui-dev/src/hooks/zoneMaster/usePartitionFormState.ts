import { useState, useMemo, useEffect, useRef } from "react";
import { PartitionFormState, PartitionFormErrors } from "@/types/zone-master/properties/partition-form.types";
import { ZonePropertyItem } from "@/types/zone-master/properties/zoneProperty.types";
import { WingItem } from "@/types/zone-master/properties/wing.types";
import { Floor } from "@/types/floor.types";
import { SocietyDetailItem } from "@/types/zone-master/properties/societyDetails.types";
import { WingDetailsMastItem } from "@/types/zone-master/properties/wingDetailsMast.types";
import { BuildingStructureItem } from "@/types/zone-master/properties/building-structure.types";

const INITIAL: PartitionFormState = {
  mainPropertyId: null,
  partitionNo: "0",
  partitionType: "wing",
  isActive: true,
  bulkCreateMode: false,
  alphanumericMode: false,
  createNewWing: false,
  wingLetter: "",
  fromFloor: "",
  toFloor: "",
  noOfFlatOnOneFloor: "",
  flatStart: "",
  incrementedBy: "",
  prefix: "",
  generationType: "",
  fromPartition: "",
  toPartition: "",
  selectedWingForAmenity: "",
  fromAmenity: "",
  toAmenity: "",
};

interface UsePartitionFormStateProps {
  selectedPropertyId: number | null;
  ssrNextPartitionNumber: number | null;
  ssrProperties: ZonePropertyItem[];
  ssrWings: WingItem[];
  ssrFloors: Floor[];
  ssrSocietyDetails: SocietyDetailItem[];
}

export function usePartitionFormState({
  selectedPropertyId,
  ssrNextPartitionNumber,
  ssrProperties,
  ssrWings,
  ssrFloors,
  ssrSocietyDetails,
}: UsePartitionFormStateProps) {
  // Initialize form state from SSR prop
  const initialFormState = useMemo(() => ({
    ...INITIAL,
    mainPropertyId: selectedPropertyId,
    fromPartition: ssrNextPartitionNumber !== null ? String(ssrNextPartitionNumber) : "",
  }), [selectedPropertyId, ssrNextPartitionNumber]);

  const [form, setForm] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<PartitionFormErrors>({});
  
  // State for all properties - initialized from SSR data
  const [allProperties, setAllProperties] = useState<ZonePropertyItem[]>(ssrProperties);
  const [loadingProperties] = useState(false);

  // State for wings - initialized from SSR data
  const [wings] = useState<WingItem[]>(ssrWings);

  // State for floors - initialized from SSR data
  const [floors] = useState<Floor[]>(ssrFloors);
  const [loadingFloors] = useState(false);

  // Society details from SSR - with state for client-side updates after mutations.
  // At most one row per property (society-level info only, wing identity now
  // lives on WingDetailsMast).
  const [societyDetails, setSocietyDetails] = useState<SocietyDetailItem[]>(ssrSocietyDetails);

  // Track previous ssrSocietyDetails to avoid unnecessary updates
  const prevSsrSocietyDetailsRef = useRef<SocietyDetailItem[]>(ssrSocietyDetails);

  // WingDetailsMast records - the actual per-wing list for this property's
  // society record. Fetched client-side (see useWingDetailsMastList) once the
  // society record's id is known; not seeded from SSR.
  const [wingDetailsMast, setWingDetailsMast] = useState<WingDetailsMastItem[]>([]);

  // State for building preview modal
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<BuildingStructureItem[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Sync form state when prop changes (for navigation)
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm(prev => {
      if (prev.mainPropertyId === selectedPropertyId) {
        return prev; // No change needed
      }
      return {
        ...prev,
        mainPropertyId: selectedPropertyId,
        fromPartition: ssrNextPartitionNumber !== null ? String(ssrNextPartitionNumber) : "",
      };
    });
  }, [selectedPropertyId, ssrNextPartitionNumber]);

  // Sync society details when SSR prop changes
  useEffect(() => {
    if (prevSsrSocietyDetailsRef.current !== ssrSocietyDetails) {
      const societyDetailsString = JSON.stringify(ssrSocietyDetails);
      const prevSocietyDetailsString = JSON.stringify(prevSsrSocietyDetailsRef.current);
      if (societyDetailsString !== prevSocietyDetailsString) {
        setSocietyDetails(ssrSocietyDetails);
      }
      prevSsrSocietyDetailsRef.current = ssrSocietyDetails;
    }
  }, [ssrSocietyDetails]);

  // Derive selected property from SSR data and prop
  const selectedProperty = useMemo(() => {
    if (!selectedPropertyId) return null;
    return ssrProperties.find(p => p.id === selectedPropertyId) || null;
  }, [selectedPropertyId, ssrProperties]);

  // Resolve the WingDetailsMast.id (wingDetailId) for the currently selected
  // wing letter. form.wingLetter holds the Wing master's wingNo; we cross
  // reference the Wing master list to get its id (wingMasterId), then find
  // the matching WingDetailsMast row for this property's society record.
  const selectedWingDetailId = useMemo(() => {
    if (!form.wingLetter) return undefined;
    const wingMaster = wings.find(w => w.wingNo === form.wingLetter);
    if (!wingMaster) return undefined;
    const wingDetail = wingDetailsMast.find(w => w.wingMasterId === wingMaster.id && !w.markedForDeletion);
    return wingDetail?.id;
  }, [form.wingLetter, wings, wingDetailsMast]);

  return {
    form,
    setForm,
    loading,
    setLoading,
    errors,
    setErrors,
    allProperties,
    setAllProperties,
    loadingProperties,
    wings,
    floors,
    loadingFloors,
    societyDetails,
    setSocietyDetails,
    wingDetailsMast,
    setWingDetailsMast,
    showPreview,
    setShowPreview,
    previewData,
    setPreviewData,
    loadingPreview,
    setLoadingPreview,
    selectedProperty,
    selectedWingDetailId,
    INITIAL,
  };
}
