/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect */
'use client';

import React from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { FloorData, RoomTypeResponse } from '@/types/room-details.types';
import { mapFormToPayload, normalizeFloorData } from '@/lib/utils/floorSubmission/floor-mappers';
import {
  submitFloorSubmissionNoRedirectAction,
  updateFloorSubmissionNoRedirectAction,
  getSubTypeOfUseDataAction,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions';
import { useFloorFormState } from '@/hooks/ptis/floorSubmission/useFloorFormState';
import { checkIsUtilityCategory } from '@/lib/utils/floorSubmission/floor-utility-checks';

import { FloorResponse, ConstructionTypeResponse, TypeOfUseApiItem, SubFloorResponse } from '@/types/floor-details.types';
import { LookupData } from '@/types/common-details.types';

interface UseAddFloorDrawerParams {
  open: boolean;
  onClose: () => void;
  initialFloorType?: 'Construction' | 'OpenPlot';
  propertyId?: number | string;
  locale?: string;
  floorOptions?: FloorResponse[];
  constructionTypeOptions?: ConstructionTypeResponse[];
  useOptions?: TypeOfUseApiItem[];
  subFloorOptions?: SubFloorResponse[];
  isPlotCategory?: boolean;
  floorId?: number | string;
  roomTypeData?: RoomTypeResponse[];
  initialPlotArea?: {
    length?: number | string | null;
    width?: number | string | null;
    totalPlotArea?: number | string | null;
  } | null;
  existingFloors?: any[];
  initialFloorDetails?: any;
}

export const useAddFloorDrawer = ({
  open,
  onClose,
  initialFloorType = 'Construction',
  propertyId,
  locale = 'en',
  floorOptions: preFetchedFloorOptions,
  constructionTypeOptions: preFetchedConstructionTypeOptions,
  useOptions: preFetchedUseOptions,
  subFloorOptions: preFetchedSubFloorOptions,
  isPlotCategory = false,
  floorId,
  roomTypeData: preFetchedRoomTypeData,
  initialPlotArea,
  existingFloors: propsExistingFloors,
  initialFloorDetails,
}: UseAddFloorDrawerParams) => {
  const t = useTranslations('quickDataEntry');

  // ---------- Form State (reusing floorSubmission hook) ----------
  const formState = useFloorFormState();
  const {
    INITIAL_FORM_STATE,
    editingFloorForm,
    setEditingFloorForm,
    formErrors,
    setFormErrors,
    showRoomSubmission,
    setShowRoomSubmission,
    roomsInputRef,
    areaInputRef,
    validateForm,
    setIsAddingNewFloor,
  } = formState;

  const [selectedFloorType, _setSelectedFloorType] = React.useState<'Construction' | 'OpenPlot'>(
    isPlotCategory ? 'OpenPlot' : initialFloorType
  );

  const setSelectedFloorType = React.useCallback((type: 'Construction' | 'OpenPlot') => {
    _setSelectedFloorType(prev => {
      if (prev !== type) {
        setEditingFloorForm(INITIAL_FORM_STATE);
        setFormErrors({});
      }
      return type;
    });
  }, [INITIAL_FORM_STATE, setEditingFloorForm, setFormErrors]);

  React.useEffect(() => {
    if (open) {
      _setSelectedFloorType(isPlotCategory ? 'OpenPlot' : initialFloorType);
      setEditingFloorForm(INITIAL_FORM_STATE);
      setFormErrors({});
      if (setIsAddingNewFloor) {
        setIsAddingNewFloor(!floorId);
      }
    }
  }, [open, isPlotCategory, initialFloorType, floorId, setEditingFloorForm, setFormErrors, setIsAddingNewFloor, INITIAL_FORM_STATE]);

  // ---------- Lookups Options derived directly from Props ----------
  const floorOptions = preFetchedFloorOptions || [];
  const floorLookup = React.useMemo(() => preFetchedFloorOptions || [], [preFetchedFloorOptions]);
  const subFloorOptions = preFetchedSubFloorOptions || [];
  const subFloorLookup = React.useMemo(() => preFetchedSubFloorOptions || [], [preFetchedSubFloorOptions]);
  const constructionTypeOptions = preFetchedConstructionTypeOptions || [];
  const constructionLookup = React.useMemo(() => preFetchedConstructionTypeOptions || [], [preFetchedConstructionTypeOptions]);
  const useOptions = preFetchedUseOptions || [];
  const useLookup = React.useMemo(() => preFetchedUseOptions || [], [preFetchedUseOptions]);

  const [subTypeOptionsFromData, setSubTypeOptionsFromData] = React.useState<string[]>([]);
  const [subTypeData, setSubTypeData] = React.useState<LookupData[]>([]);
  const [isSaving, setIsSaving] = React.useState(false);
  const roomTypeData = preFetchedRoomTypeData || [];

  React.useEffect(() => {
    if (open && floorId && floorId !== 'new' && initialFloorDetails) {
      const normalized = normalizeFloorData(initialFloorDetails as Record<string, unknown>, {
        floor: floorLookup,
        subFloor: subFloorLookup,
        construction: constructionLookup,
        use: useLookup,
        subType: [],
      });
      setEditingFloorForm(normalized);
      if (setIsAddingNewFloor) {
        setIsAddingNewFloor(false);
      }
      const rawSelectedFloorType = (normalized as Record<string, unknown>).selectedFloorType;
      if (rawSelectedFloorType === 'OpenPlot' || rawSelectedFloorType === 'Construction') {
        _setSelectedFloorType(rawSelectedFloorType);
      } else if (
        normalized.constructionTypeId &&
        String(normalized.conTyp || '').toLowerCase() !== 'op' &&
        !String(normalized.conTyp || '').toLowerCase().includes('open plot')
      ) {
        _setSelectedFloorType('Construction');
      } else {
        _setSelectedFloorType('OpenPlot');
      }
      // Fetch subtype options for edit mode
      if (normalized.typeOfUseId) {
        const fetchSubTypes = async () => {
          try {
            const subTypeRes = await getSubTypeOfUseDataAction(String(normalized.typeOfUseId));
            if (Array.isArray(subTypeRes)) {
              setSubTypeData(subTypeRes);
              setSubTypeOptionsFromData(subTypeRes.map(st => st.searchKey ? `${st.searchKey} - ${st.description}` : st.description));
            }
          } catch {
            // silent catch
          }
        };
        fetchSubTypes();
      }
    }
  }, [open, floorId, initialFloorDetails]);

  const [plotAreaSqM, setPlotAreaSqM] = React.useState<number>(
    initialPlotArea?.totalPlotArea ? Number(initialPlotArea.totalPlotArea) : 0
  );
  const [existingFloors, setExistingFloors] = React.useState<any[]>(
    propsExistingFloors || []
  );
  const isDataLoaded = true;

  React.useEffect(() => {
    if (initialPlotArea?.totalPlotArea) {
      setPlotAreaSqM(Number(initialPlotArea.totalPlotArea));
    } else {
      setPlotAreaSqM(0);
    }
  }, [initialPlotArea]);

  React.useEffect(() => {
    setExistingFloors(propsExistingFloors || []);
  }, [propsExistingFloors]);

  const mappedExistingFloors = React.useMemo(() => {
    return existingFloors.map((f) =>
      normalizeFloorData(f as Record<string, unknown>, {
        floor: floorLookup,
        subFloor: subFloorLookup,
        construction: constructionLookup,
        use: useLookup,
        subType: [],
      })
    );
  }, [existingFloors, floorLookup, subFloorLookup, constructionLookup, useLookup]);

  const isRecordOpenPlot = (floor: any) => {
    return (
      floor.isOpenPlot === true ||
      floor.selectedFloorType === 'OpenPlot' ||
      ((!floor.floorId || floor.floorId === '0' || floor.floor === '0') &&
        (!floor.constructionTypeId ||
          floor.constructionTypeId === '0' ||
          !floor.conTyp ||
          String(floor.conTyp).toLowerCase().includes('open plot') ||
          String(floor.conTyp).toLowerCase() === 'op'))
    );
  };

  // Utilized Area (Construction Area) = Sum of all Construction floor areas
  const totalConstructionAreaSqM = React.useMemo(() => {
    if (!isDataLoaded) return 0;
    const savedConstructionFloors = mappedExistingFloors.filter(
      (f) => !isRecordOpenPlot(f) && (!floorId || f.id !== Number(floorId))
    );
    let sum = savedConstructionFloors.reduce((s, f) => s + (parseFloat(String(f.builtupAreaSqM || f.areaSqM || '0')) || 0), 0);
    if (selectedFloorType === 'Construction') {
      sum += parseFloat(String(editingFloorForm.builtupAreaSqM || editingFloorForm.areaSqM || '0')) || 0;
    }
    return sum;
  }, [isDataLoaded, mappedExistingFloors, floorId, editingFloorForm, selectedFloorType]);

  // Open Space sum (includes all Open Plots)
  const totalOpenSpaceAreaSqM = React.useMemo(() => {
    if (!isDataLoaded) return 0;
    const savedOpenSpaceFloors = mappedExistingFloors.filter(
      (f) => isRecordOpenPlot(f) && (!floorId || f.id !== Number(floorId))
    );
    let sum = savedOpenSpaceFloors.reduce((s, f) => s + (parseFloat(String(f.areaSqM || f.builtupAreaSqM || '0')) || 0), 0);
    if (selectedFloorType === 'OpenPlot') {
      sum += parseFloat(String(editingFloorForm.areaSqM || editingFloorForm.builtupAreaSqM || '0')) || 0;
    }
    return sum;
  }, [isDataLoaded, mappedExistingFloors, floorId, editingFloorForm, selectedFloorType]);

  // Already utilized Open Space excluding currently edited one (if any)
  const alreadyUtilizedOpenSpaceAreaSqM = React.useMemo(() => {
    if (!isDataLoaded) return 0;
    return mappedExistingFloors
      .filter((f) => isRecordOpenPlot(f) && (!floorId || f.id !== Number(floorId)))
      .reduce((sum, f) => sum + (parseFloat(String(f.areaSqM || f.builtupAreaSqM || '0')) || 0), 0);
  }, [isDataLoaded, mappedExistingFloors, floorId]);

  const enteredOpenSpaceAreaSqM = React.useMemo(() => {
    if (selectedFloorType === 'OpenPlot') {
      return parseFloat(String(editingFloorForm.areaSqM || editingFloorForm.builtupAreaSqM || '0')) || 0;
    }
    return 0;
  }, [editingFloorForm.areaSqM, editingFloorForm.builtupAreaSqM, selectedFloorType]);

  // Remaining Area = Total Plot Area - Utilized Area - Open Space Area
  const remainingAvailablePlotAreaSqM = React.useMemo(() => {
    if (!isDataLoaded) return 0;
    return plotAreaSqM - totalConstructionAreaSqM - totalOpenSpaceAreaSqM;
  }, [isDataLoaded, plotAreaSqM, totalConstructionAreaSqM, totalOpenSpaceAreaSqM]);

  const enteredFloorAreaSqM = React.useMemo(() => {
    if (selectedFloorType === 'Construction') {
      return parseFloat(String(editingFloorForm.builtupAreaSqM || editingFloorForm.areaSqM || '0')) || 0;
    }
    return 0;
  }, [editingFloorForm.builtupAreaSqM, editingFloorForm.areaSqM, selectedFloorType]);

  const isOpenSpaceAreaExceeded = React.useMemo(() => {
    return false; // remainingAvailablePlotAreaSqM < 0;
  }, [remainingAvailablePlotAreaSqM]);

  const isFloorAreaExceeded = React.useMemo(() => {
    return false; // remainingAvailablePlotAreaSqM < 0;
  }, [remainingAvailablePlotAreaSqM]);

  const isAreaExceeded = React.useMemo(() => {
    return false; // remainingAvailablePlotAreaSqM < 0;
  }, [remainingAvailablePlotAreaSqM]);

  // Auto-map construction type "op" (open plot) for Open Space / Open Plot
  React.useEffect(() => {
    if (selectedFloorType === 'OpenPlot') {
      const openPlotCon = constructionLookup?.find(
        (c: any) =>
          String(c.constructionCode || '').toLowerCase() === 'op' ||
          String(c.description || '').toLowerCase() === 'open plot'
      );
      if (openPlotCon) {
        const conId = String(openPlotCon.constructionTypeId || openPlotCon.id || '');
        const conDesc = String(openPlotCon.description || '');
        if (editingFloorForm.constructionTypeId !== conId || editingFloorForm.conTyp !== conDesc) {
          setEditingFloorForm(prev => ({
            ...prev,
            constructionTypeId: conId,
            conTyp: conDesc,
            constructionTypeDescription: conDesc,
          }));
        }
      }
    }
  }, [selectedFloorType, constructionLookup, editingFloorForm.constructionTypeId, editingFloorForm.conTyp, setEditingFloorForm]);

  // ---------- Stub / Navigation Handlers ----------
  // Stubs exist to satisfy the common FloorForm interface requirements
  const handleOpenDropdown = React.useCallback(
    (_key: 'loadFloor' | 'loadSubFloor' | 'loadConstruction' | 'loadUsage' | 'loadSubType') => {
      // Lookups are pre-loaded on-demand when the drawer opens
    },
    []
  );

  const updateUrlParams = React.useCallback(async (params: Record<string, string | null>) => {
    if (params.typeOfUseId) {
      try {
        const response = await getSubTypeOfUseDataAction(params.typeOfUseId);
        if (Array.isArray(response)) {
          setSubTypeData(response);
          setSubTypeOptionsFromData(response.map(st => st.searchKey ? `${st.searchKey} - ${st.description}` : st.description));
        } else {
          setSubTypeOptionsFromData([]);
          setSubTypeData([]);
        }
      } catch {
        toast.error('Failed to load sub-usage types');
      }
    }
  }, []);

  const handleOpenRenterManagement = React.useCallback((_form?: FloorData) => {
    // Renter management staging is deferred for the drawer workflow
  }, []);

  const [, startTransition] = React.useTransition();

  // ---------- Actions ----------
  const handleDiscard = React.useCallback(() => {
    setEditingFloorForm(INITIAL_FORM_STATE);
    setFormErrors({});
    onClose();
  }, [onClose, INITIAL_FORM_STATE, setEditingFloorForm, setFormErrors]);

  const saveForm = React.useCallback(async (onSuccessCallback: () => void) => {
    if (isSaving) return;

    if (selectedFloorType === 'OpenPlot' && isOpenSpaceAreaExceeded) {
      const availableArea = plotAreaSqM - alreadyUtilizedOpenSpaceAreaSqM;
      const validationMsg = `Total utilized area cannot exceed the Plot Area.

Plot Area: ${plotAreaSqM} Sq M
Already Utilized Area: ${alreadyUtilizedOpenSpaceAreaSqM} Sq M
Attempted Area: ${enteredOpenSpaceAreaSqM} Sq M
Available Area: ${availableArea} Sq M

Please enter an area less than or equal to the available area.`;

      toast.error(validationMsg, { duration: 6000 });
      return;
    }

    if (selectedFloorType === 'Construction' && isFloorAreaExceeded) {
      const validationMsg = `Floor Built-up Area cannot exceed the available Plot Area.

Plot Area: ${plotAreaSqM} Sq M
Open Space Utilized Area: ${totalOpenSpaceAreaSqM} Sq M
Available Area: ${remainingAvailablePlotAreaSqM} Sq M
Entered Floor Built-up Area: ${enteredFloorAreaSqM} Sq M

Please enter an area less than or equal to the available area.`;

      toast.error(validationMsg, { duration: 6000 });
      return;
    }

    // Use centralized form validation from useFloorFormState
    const isValid = validateForm(editingFloorForm, t, selectedFloorType);
    if (!isValid) {
      toast.error(t('floor.errors.validationFailed') || 'Please fix the errors in the form.');
      return;
    }

    // Validate rooms count mismatch first (for construction floors)
    if (selectedFloorType === 'Construction') {
      const isUtility = checkIsUtilityCategory(editingFloorForm.typeOfUseCategoryId);

      if (!isUtility) {
        const enteredRooms = parseInt(String(editingFloorForm.rooms || editingFloorForm.noOfRooms || 0), 10);
        const roomDetailsCount = Array.isArray(editingFloorForm.roomWiseSubmissionDetails)
          ? editingFloorForm.roomWiseSubmissionDetails.filter((r: any) => {
              const area = Number(r.area || r.areaSqMtr || r.totalAreaSqMtr || r.total || r.carpetArea || 0);
              return area > 0;
            }).length
          : 0;

        if (enteredRooms > 0 && roomDetailsCount > 0 && enteredRooms !== roomDetailsCount) {
          setFormErrors((prev) => ({
            ...prev,
            rooms: t('floor.errors.roomCountMismatch') || `Expected details for ${enteredRooms} rooms, but found ${roomDetailsCount}. Please update room details.`
          }));
          toast.error(t('floor.errors.roomCountMismatch') || `Expected details for ${enteredRooms} rooms, but found ${roomDetailsCount}. Please update room details.`);
          return;
        }
      }
    }

    setIsSaving(true);
    const pid = Number(propertyId || 0);

    try {
      const isEditMode = !!(floorId && floorId !== 'new');

      const payload = mapFormToPayload({
        formData: editingFloorForm,
        floorLookup: floorLookup,
        subFloorLookup: subFloorLookup,
        constructionLookup: constructionLookup,
        useLookup: useLookup,
        subTypeLookup: subTypeData || [],
        propertyId: pid,
        isAddingNew: !isEditMode,
        existingFloorId: isEditMode ? floorId : undefined,
        selectedFloorType: selectedFloorType,
        isPlotCategory: isPlotCategory,
      });

      const response = isEditMode
        ? await updateFloorSubmissionNoRedirectAction(floorId, payload, locale, String(pid))
        : await submitFloorSubmissionNoRedirectAction(payload, locale, String(pid));

      if (response.success) {
        toast.success(
          isEditMode
            ? (t('floor.floorUpdatedSuccess') || 'Floor details updated successfully')
            : (t('floor.floorAddedSuccess') || 'Floor details added successfully')
        );
        onSuccessCallback();
      } else {
        toast.error(response.error || 'Failed to save floor details');
      }
    } catch {
      toast.error('An unexpected error occurred while saving.');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, validateForm, editingFloorForm, t, selectedFloorType, propertyId, floorLookup, subFloorLookup, constructionLookup, useLookup, subTypeData, locale, setFormErrors, floorId]);

  const handleSave = React.useCallback(() => {
    saveForm(() => {
      onClose();
    });
  }, [saveForm, onClose]);

  const handleSaveAndNext = React.useCallback(() => {
    saveForm(() => {
      setEditingFloorForm(INITIAL_FORM_STATE);
      setFormErrors({});
    });
  }, [saveForm, INITIAL_FORM_STATE, setEditingFloorForm, setFormErrors]);

  return {
    t,
    editingFloorForm,
    setEditingFloorForm,
    formErrors,
    setFormErrors,
    selectedFloorType,
    setSelectedFloorType,
    showRoomSubmission,
    setShowRoomSubmission,
    floorOptions,
    floorLookup,
    subFloorOptions,
    subFloorLookup,
    constructionTypeOptions,
    constructionLookup,
    useOptions,
    useLookup,
    subTypeOptionsFromData,
    subTypeData,
    isSaving,
    roomsInputRef,
    areaInputRef,
    handleOpenDropdown,
    updateUrlParams,
    handleOpenRenterManagement,
    startTransition,
    handleDiscard,
    handleSave,
    handleSaveAndNext,
    roomTypeData,
    // validation exports
    plotAreaSqM,
    setPlotAreaSqM,
    isAreaExceeded,
    isOpenSpaceAreaExceeded,
    isFloorAreaExceeded,
    totalOpenSpaceAreaSqM,
    remainingAvailablePlotAreaSqM,
    enteredFloorAreaSqM,
    alreadyUtilizedOpenSpaceAreaSqM,
    enteredOpenSpaceAreaSqM,
    totalConstructionAreaSqM,
  };
};
