'use client';
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useMemo, useEffect, useRef, Dispatch, SetStateAction } from 'react';
import { FloorData } from '@/types/room-details.types';
import { EditSidebarProps } from '@/types/floor-details.types';
import { LookupData } from '@/types/common-details.types';
import { normalizeFloorData } from '@/lib/utils/floorSubmission/floor-normalization';
import { getCookieValue } from '@/lib/utils/cookie';
import { ReadonlyURLSearchParams } from 'next/navigation';
import { isPlotCategory as checkIsPlotCategory } from '@/lib/utils/ptis/category-helpers';


function getRenterDataFromStorage(floorId: string | number | null | undefined, initialPropertyID?: string | number): any {
  if (!floorId) return null;
  let renterData: any = null;
  try {
    const sessionRenter = sessionStorage.getItem(floorId === 'new' ? 'renter_data_new' : `renter_data_${floorId}`);
    if (sessionRenter) {
      renterData = JSON.parse(sessionRenter);
    }
  } catch (_e) { }

  if (!renterData && floorId !== 'new') {
    const cookieKey = `renter_${floorId}`;
    const renterCookie = getCookieValue(cookieKey) || getCookieValue('renter_data');
    if (renterCookie) {
      try {
        const parsed = JSON.parse(renterCookie);
        if (cookieKey === `renter_${floorId}` ||
          (String(parsed.propertyId) === String(initialPropertyID) && String(parsed.floorId) === String(floorId))) {
          renterData = parsed;
        }
      } catch (_e) { }
    }
  }
  return renterData;
}

function getSavedFormFromStorage(floorId: string | number | null | undefined, restoredSessionFormRef: React.MutableRefObject<any>): any {
  if (!floorId) return null;
  let savedForm: any = null;
  try {
    const sessionForm = sessionStorage.getItem('editingFloorForm');
    if (sessionForm) {
      const parsed = JSON.parse(sessionForm);
      const isMatch = floorId === 'new' ? (!parsed.id || parsed.id === 'new') : (String(parsed.id) === String(floorId));
      if (isMatch) {
        savedForm = parsed;
        restoredSessionFormRef.current = parsed;
        sessionStorage.removeItem('editingFloorForm'); // Clear immediately
      }
    } else if (restoredSessionFormRef.current) {
      const parsed = restoredSessionFormRef.current;
      const isMatch = floorId === 'new' ? (!parsed.id || parsed.id === 'new') : (String(parsed.id) === String(floorId));
      if (isMatch) {
        savedForm = parsed;
      }
    }
  } catch (_e) { }
  return savedForm;
}

export const useFloorSync = (params: {
  props: EditSidebarProps;
  isAddingNewFloor: boolean;
  setIsAddingNewFloor: (val: boolean) => void;
  editingFloorForm: FloorData;
  setEditingFloorForm: Dispatch<SetStateAction<FloorData>>;
  localFloors: FloorData[];
  setLocalFloors: (val: FloorData[]) => void;
  setSelectedFloor: (val: FloorData | null) => void;
  selectedFloor: FloorData | null;
  updateUrlParams: (params: Record<string, string | null>) => void;
  searchParams: ReadonlyURLSearchParams;
  INITIAL_FORM_STATE: FloorData;
  selectedFloorType?: 'Construction' | 'OpenPlot';
}) => {
  const hasSyncedRef = useRef<string | number | null>(null);
  const restoredSessionFormRef = useRef<any>(null);
  const hasInitializedPlotAreaRef = useRef<string | null>(null);
  const currentFloorIdUrl = params.searchParams.get('floorId');
  const currentDrawerUrl = params.searchParams.get('drawer');

  const {
    props,
    isAddingNewFloor,
    setIsAddingNewFloor,
    editingFloorForm,
    setEditingFloorForm,
    setLocalFloors,
    setSelectedFloor,
    selectedFloor,
    INITIAL_FORM_STATE,
  } = params;

  useEffect(() => {
    hasInitializedPlotAreaRef.current = null;
  }, [currentFloorIdUrl, currentDrawerUrl]);

  const { initialFloors = [], initialFloorDetails = null, initialPropertyID } = props;

  // 1. Map Initial Floors (Derived State)
  const mappedInitialFloors = useMemo(() => {
    return initialFloors.map((f) =>
      normalizeFloorData(f as Record<string, unknown>, {
        floor: props.floorData as LookupData[],
        subFloor: props.subFloorData as LookupData[],
        construction: props.constructionTypeData as LookupData[],
        use: props.useData as LookupData[],
        subType: props.subTypeData as LookupData[],
      })
    );
  }, [initialFloors, props.floorData, props.subFloorData, props.constructionTypeData, props.useData, props.subTypeData]);

  // 2. Sync localFloors with mappedInitialFloors (useEffect)
  useEffect(() => {
    setLocalFloors(mappedInitialFloors);
  }, [mappedInitialFloors, setLocalFloors]);

  // 3. Sync initialFloorDetails with form state (useEffect)
  const currentDetailsId = useMemo(() => {
    return typeof initialFloorDetails === 'object' && initialFloorDetails !== null
      ? (initialFloorDetails as Record<string, unknown>).id as string | number | undefined
      : undefined;
  }, [initialFloorDetails]);

  const selectedFloorRef = useRef(selectedFloor);
  useEffect(() => {
    selectedFloorRef.current = selectedFloor;
  }, [selectedFloor]);

  useEffect(() => {
    if (initialFloorDetails) {
      if (hasSyncedRef.current !== currentDetailsId) {
        const floorDataMapped = normalizeFloorData(initialFloorDetails as Record<string, unknown>, {
          floor: props.floorData as LookupData[],
          subFloor: props.subFloorData as LookupData[],
          construction: props.constructionTypeData as LookupData[],
          use: props.useData as LookupData[],
          subType: props.subTypeData as LookupData[],
        });

        // Hydrate from Storage
        const renterData = getRenterDataFromStorage(floorDataMapped.id, initialPropertyID);
        const savedForm = getSavedFormFromStorage(floorDataMapped.id, restoredSessionFormRef);

        let finalForm = savedForm ? { ...savedForm } : { ...floorDataMapped };

        if (renterData) {
          const mergedRenterFields = {
            renter: 'Yes',
            renterName: renterData.renterName || renterData.renterNameEnglish || finalForm.renterName || '',
            agreementFromDate: renterData.agreementDateFrom || renterData.agreementFromDate || finalForm.agreementFromDate || null,
            agreementToDate: renterData.agreementDateTo || renterData.agreementToDate || finalForm.agreementToDate || null,
            agreementDate: renterData.agreementDate || finalForm.agreementDate || null,
            rentMonthly: renterData.rentMonthly || renterData.nonCalculateRentMonthly || finalForm.rentMonthly || 0,
            nonCalculateRentMonthly: renterData.nonCalculateRentMonthly || 0,
            rentYearly: (Number(renterData.nonCalculateRentMonthly || renterData.rentMonthly) || 0) * 12,
            renterDetails: renterData.renterDetails || finalForm.renterDetails || [],
            renterMast: renterData.renterMast || finalForm.renterMast || [],
            documentBindingId:
              renterData.documentBindingId ||
              finalForm.documentBindingId ||
              (renterData.renterMast && renterData.renterMast[0]?.documentBindingId) ||
              undefined,
            documentGuid:
              renterData.documentGuid ||
              finalForm.documentGuid ||
              (renterData.renterMast && renterData.renterMast[0]?.documentGuid) ||
              undefined,
          };
          finalForm = {
            ...finalForm,
            ...mergedRenterFields,
          };
        } else if (savedForm) {
          finalForm.renter = floorDataMapped.renter === 'Yes' ? 'Yes' : 'No';
        }

        setEditingFloorForm(finalForm);
        setSelectedFloor(finalForm);
        hasSyncedRef.current = currentDetailsId ?? null;
      }
    } else {
      hasSyncedRef.current = null;
      if (!isAddingNewFloor && !selectedFloorRef.current && (!currentFloorIdUrl || currentFloorIdUrl === 'new')) {
        setEditingFloorForm(INITIAL_FORM_STATE);
        setSelectedFloor(null);
      }
    }
  }, [
    currentDetailsId,
    initialFloorDetails,
    isAddingNewFloor,
    initialPropertyID,
    props.floorData,
    props.subFloorData,
    props.constructionTypeData,
    props.useData,
    props.subTypeData,
    setEditingFloorForm,
    setSelectedFloor,
    INITIAL_FORM_STATE,
    currentFloorIdUrl,
  ]);

  // Real-time autosave disabled to prevent unsaved changes from persisting across manual browser refreshes

  // 4. Sync URL Param Renter Cookie (useEffect Sync)

  useEffect(() => {
    if (currentFloorIdUrl === 'new' || currentDrawerUrl === 'add') {
      setIsAddingNewFloor(true);
      setSelectedFloor(null);

      const savedForm = getSavedFormFromStorage('new', restoredSessionFormRef);
      const renterData = getRenterDataFromStorage('new');

      let finalForm = savedForm ? { ...savedForm } : null;

      if (renterData) {
        const mergedRenterFields = {
          renter: 'Yes',
          renterName: renterData.renterName || renterData.renterNameEnglish || (finalForm?.renterName || ''),
          agreementFromDate: renterData.agreementDateFrom || renterData.agreementFromDate || (finalForm?.agreementFromDate || null),
          agreementToDate: renterData.agreementDateTo || renterData.agreementToDate || (finalForm?.agreementToDate || null),
          agreementDate: renterData.agreementDate || (finalForm?.agreementDate || null),
          rentMonthly: renterData.rentMonthly || renterData.nonCalculateRentMonthly || (finalForm?.rentMonthly || 0),
          nonCalculateRentMonthly: renterData.nonCalculateRentMonthly || 0,
          rentYearly: (Number(renterData.nonCalculateRentMonthly || renterData.rentMonthly) || 0) * 12,
          renterDetails: renterData.renterDetails || (finalForm?.renterDetails || []),
          renterMast: renterData.renterMast || (finalForm?.renterMast || []),
          documentBindingId:
            renterData.documentBindingId ||
            finalForm?.documentBindingId ||
            (renterData.renterMast && renterData.renterMast[0]?.documentBindingId) ||
            undefined,
          documentGuid:
            renterData.documentGuid ||
            finalForm?.documentGuid ||
            (renterData.renterMast && renterData.renterMast[0]?.documentGuid) ||
            undefined,
        };

        if (finalForm) {
          finalForm = {
            ...finalForm,
            ...mergedRenterFields,
          };
        } else {
          finalForm = {
            ...renterData,
            ...mergedRenterFields,
          };
        }
      } else if (finalForm) {
        finalForm.renter = 'No';
      }

      if (finalForm) {
        setEditingFloorForm((prev) => ({
          ...prev,
          ...finalForm,
          id: undefined, // It's a new floor, keep id undefined
        }));
      } else {
        setEditingFloorForm((prev) => {
          if (prev.floorId) return prev;
          const gFloor = (props.floorData as { floorCode?: string; floorId?: number; description?: string }[] || []).find(
            (f) => f.floorCode === 'G' || f.description?.startsWith('G -') || f.description?.startsWith('G-')
          );
          if (gFloor) {
            return {
              ...prev,
              floorId: String(gFloor.floorId || gFloor.floorCode || ''),
              floor: gFloor.description || 'G - तळमजला',
              floorDescription: gFloor.description || 'G - तळमजला',
            };
          }
          return prev;
        });
      }
    } else if (currentFloorIdUrl && currentFloorIdUrl !== 'new') {
      if (isAddingNewFloor && !editingFloorForm.id) {
        return;
      }
      setIsAddingNewFloor(false);
      const renterData = getRenterDataFromStorage(currentFloorIdUrl, initialPropertyID);
      const savedForm = getSavedFormFromStorage(currentFloorIdUrl, restoredSessionFormRef);

      let finalForm = savedForm ? { ...savedForm } : null;

      if (renterData) {
        const mergedRenterFields = {
          renter: 'Yes',
          renterName: renterData.renterName || renterData.renterNameEnglish || (finalForm?.renterName || ''),
          agreementFromDate: renterData.agreementDateFrom || renterData.agreementFromDate || (finalForm?.agreementFromDate || null),
          agreementToDate: renterData.agreementDateTo || renterData.agreementToDate || (finalForm?.agreementToDate || null),
          agreementDate: renterData.agreementDate || (finalForm?.agreementDate || null),
          rentMonthly: renterData.rentMonthly || renterData.nonCalculateRentMonthly || (finalForm?.rentMonthly || 0),
          nonCalculateRentMonthly: renterData.nonCalculateRentMonthly || 0,
          rentYearly: (Number(renterData.nonCalculateRentMonthly || renterData.rentMonthly) || 0) * 12,
          renterDetails: renterData.renterDetails || (finalForm?.renterDetails || []),
          renterMast: renterData.renterMast || (finalForm?.renterMast || []),
        };

        if (finalForm) {
          finalForm = {
            ...finalForm,
            ...mergedRenterFields,
          };
        } else {
          finalForm = {
            ...renterData,
            ...mergedRenterFields,
            id: renterData.id || renterData.propertyDetailsId || currentFloorIdUrl,
          };
        }
      } else if (finalForm) {
        const originalFloor = mappedInitialFloors.find(f => String(f.id) === String(currentFloorIdUrl));
        finalForm.renter = originalFloor?.renter === 'Yes' ? 'Yes' : 'No';
      }

      if (finalForm) {
        setEditingFloorForm((prev) => ({
          ...prev,
          ...finalForm,
        }));
        setSelectedFloor(finalForm);
      }
    }
  }, [currentFloorIdUrl, currentDrawerUrl, isAddingNewFloor, editingFloorForm.id, setEditingFloorForm, setSelectedFloor, setIsAddingNewFloor, mappedInitialFloors, initialPropertyID, props.floorData]);

  // Plot area auto-population disabled to keep Open Space form blank
  /*
  useEffect(() => {
    const isPropertyCategoryPlot = checkIsPlotCategory(props.initialPropertyData?.categoryName as string | undefined);
    const isPlot = isPropertyCategoryPlot;

    if (isPlot && props.initialPlotArea) {
      if (hasInitializedPlotAreaRef.current === 'initialized') {
        return;
      }

      const apiLength = props.initialPlotArea.length;
      const apiWidth = props.initialPlotArea.width;
      const apiTotalPlotArea = props.initialPlotArea.totalPlotArea;

      setEditingFloorForm((prev) => {
        const hasNoLength = !prev.length || parseFloat(String(prev.length)) === 0;
        const hasNoWidth = !prev.width || parseFloat(String(prev.width)) === 0;
        const hasNoArea = !prev.areaSqM || parseFloat(String(prev.areaSqM)) === 0;

        if ((hasNoLength && apiLength) || (hasNoWidth && apiWidth) || (hasNoArea && apiTotalPlotArea)) {
          const updated = { ...prev };
          if (hasNoLength && apiLength) updated.length = String(apiLength);
          if (hasNoWidth && apiWidth) updated.width = String(apiWidth);
          if (hasNoArea && apiTotalPlotArea) {
            updated.areaSqM = String(apiTotalPlotArea);
            updated.areaSqFt = convertSqMToSqFt(Number(apiTotalPlotArea)).toFixed(2);
          }
          return updated;
        }
        return prev;
      });
      hasInitializedPlotAreaRef.current = 'initialized';
    }
  }, [
    props.initialPlotArea,
    props.initialPropertyData?.categoryName,
    setEditingFloorForm,
  ]);
  */

  // Auto open Add Open Plot Details form when category is Plot and no records exist
  useEffect(() => {
    const isPlot = checkIsPlotCategory(props.initialPropertyData?.categoryName as string | undefined);
    const hasNoFloorIdInUrl = !currentFloorIdUrl || currentFloorIdUrl === 'new';
    if (isPlot && hasNoFloorIdInUrl && !selectedFloor) {
      if (props.initialFloors.length === 0) {
        setIsAddingNewFloor(true);
      }
    }
  }, [props.initialPropertyData?.categoryName, props.initialFloors.length, currentFloorIdUrl, setIsAddingNewFloor, selectedFloor]);

  const resetRestoredSessionFormRef = () => {
    restoredSessionFormRef.current = null;
  };

  return { mappedInitialFloors, resetRestoredSessionFormRef };
};