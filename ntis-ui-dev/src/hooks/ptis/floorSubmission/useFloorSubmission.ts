/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
'use client';

import { useState, useTransition, useMemo, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { useConfirm } from '@/components/common';
import { EditSidebarProps } from '@/types/floor-details.types';
import { FloorData } from '@/types/room-details.types';
import { isPlotCategory as checkIsPlotCategory } from '@/lib/utils/ptis/category-helpers';

import { useFloorAreaValidation, isRecordOpenPlot } from './useFloorAreaValidation';
import { findOpenPlotFloorItem, findOpenPlotConstructionTypeItem } from '@/lib/utils/floorSubmission/floor-resolvers';

// Split Hooks
import { useFloorFormState } from './useFloorFormState';
import { useFloorUrlSync } from './useFloorUrlSync';
import { useFloorDataHandlers } from './useFloorDataHandlers';
import { useFloorSync } from './useFloorSync';
import { useFloorActions } from './useFloorActions';

export const useFloorSubmission = (props: EditSidebarProps) => {
  const t = useTranslations('quickDataEntry');
  const [, startTransition] = useTransition();
  const { confirm } = useConfirm();
  const hasAutoPopulatedOpenSpaceRef = useRef(false);

  // 1. Core Form State
  const formState = useFloorFormState();
  const {
    INITIAL_FORM_STATE,
    editingFloorForm,
    setEditingFloorForm,
    localFloors,
    setLocalFloors,
    formErrors,
    setFormErrors,
    isAddingNewFloor,
    setIsAddingNewFloor,
    selectedFloor,
    setSelectedFloor,
    showRoomSubmission,
    setShowRoomSubmission,
    validateForm,
  } = formState;

  // Extract property category from initialPropertyData
  const propertyCategory = useMemo(() => {
    if (props.initialPropertyData) {
      const data = props.initialPropertyData as Record<string, any>;
      return {
        categoryId: data.categoryId as number | undefined,
        categoryName: (data.categoryName || data.catPropertyCategoryName || data.propertyCategoryName) as string | undefined,
      };
    }
    return { categoryId: undefined, categoryName: undefined };
  }, [props.initialPropertyData]);

  // Check if category is Plot
  const isPlotCategory = useMemo(
    () => checkIsPlotCategory(propertyCategory.categoryName),
    [propertyCategory.categoryName]
  );

  // 2. URL and Navigation
  const urlSync = useFloorUrlSync();
  const { searchParams, updateUrlParams, router, locale, propertyId } = urlSync;

  const drawerParam = searchParams?.get('drawer');
  const initialFloorType: 'Construction' | 'OpenPlot' =
    isPlotCategory || drawerParam === 'OpenPlot' ? 'OpenPlot' : 'Construction';

  // Auto-select OpenPlot if category is Plot or drawer URL param is OpenPlot
  const [selectedFloorTypeState, setSelectedFloorTypeState] = useState<'Construction' | 'OpenPlot'>(
    initialFloorType
  );

  useEffect(() => {
    const drawer = searchParams?.get('drawer');
    if (drawer === 'OpenPlot') {
      setSelectedFloorTypeState('OpenPlot');
    } else if (drawer === 'Construction') {
      if (!isPlotCategory) {
        setSelectedFloorTypeState('Construction');
      }
    }
  }, [searchParams, isPlotCategory]);

  const selectedFloorType = isPlotCategory
    ? 'OpenPlot'
    : selectedFloor
      ? (isRecordOpenPlot(selectedFloor) ? 'OpenPlot' : 'Construction')
      : selectedFloorTypeState;

  const openPlotRecord = useMemo(() => {
    const floors = ((localFloors && localFloors.length > 0) ? localFloors : (props.initialFloors || [])) as FloorData[];
    return floors.find(
      (f: FloorData) =>
        f.isOpenPlot === true ||
        String(f.selectedFloorType).toLowerCase() === 'openplot' ||
        String((f as any).floorCode || (f as any).code || '').toLowerCase() === 'op' ||
        String(f.conTyp || (f as any).constructionCode || '').toLowerCase() === 'op' ||
        String(f.floor || '').toLowerCase().includes('open plot')
    );
  }, [localFloors, props.initialFloors]);

  const [plotAreaSqM, setPlotAreaSqM] = useState<number>(() => {
    if (openPlotRecord) {
      const area = Number((openPlotRecord as any).carpetAreaSqMeter || (openPlotRecord as any).builtupAreaSqMeter || 0);
      if (area > 0) return area;
    }
    return props.initialPlotArea?.totalPlotArea ? Number(props.initialPlotArea.totalPlotArea) : 0;
  });

  useEffect(() => {
    if (openPlotRecord) {
      const area = Number((openPlotRecord as any).carpetAreaSqMeter || (openPlotRecord as any).builtupAreaSqMeter || 0);
      if (area > 0) {
        setPlotAreaSqM(area);
        return;
      }
    }
    if (props.initialPlotArea?.totalPlotArea) {
      setPlotAreaSqM(Number(props.initialPlotArea.totalPlotArea));
    }
  }, [openPlotRecord, props.initialPlotArea]);

  const syncResult = useFloorSync({
    props,
    isAddingNewFloor,
    setIsAddingNewFloor,
    editingFloorForm,
    setEditingFloorForm,
    localFloors,
    setLocalFloors,
    setSelectedFloor,
    selectedFloor,
    updateUrlParams,
    searchParams,
    INITIAL_FORM_STATE: INITIAL_FORM_STATE as unknown as FloorData,
    selectedFloorType,
  });
  const mappedInitialFloors = syncResult?.mappedInitialFloors || [];
  const resetRestoredSessionFormRef = syncResult?.resetRestoredSessionFormRef;

  // Area validations & computations extracted to useFloorAreaValidation hook
  const {
    totalConstructionAreaSqM,
    totalOpenSpaceAreaSqM,
    remainingAvailablePlotAreaSqM,
    availableRemainingOpenSpaceAreaSqM,
    availableRemainingConstructionAreaSqM,
    isOpenSpaceAreaExceeded,
    isFloorAreaExceeded,
    isAreaExceeded,
    enteredFloorAreaSqM,
    alreadyUtilizedOpenSpaceAreaSqM,
    enteredOpenSpaceAreaSqM,
    isGroundFloorAreaExceeded,
    isOpenSpaceNegative,
  } = useFloorAreaValidation({
    localFloors,
    selectedFloor,
    editingFloorForm,
    selectedFloorType,
    isAddingNewFloor,
    plotAreaSqM,
    floorLookup: props.floorData,
    initialFloors: mappedInitialFloors,
    propertyCategoryName: propertyCategory.categoryName,
  });



  // Reset form fields when transitioning from Plot category to non-Plot category
  const prevIsPlotCategoryRef = useRef(isPlotCategory);
  useEffect(() => {
    if (!isPlotCategory && prevIsPlotCategoryRef.current) {
      setEditingFloorForm((prev) => ({
        ...prev,
        length: '',
        width: '',
        areaSqFt: '',
        areaSqM: '',
      }));
    }
    prevIsPlotCategoryRef.current = isPlotCategory;
  }, [isPlotCategory, setEditingFloorForm]);

  // Auto-map construction type "op" (open plot) for Open Space / Open Plot
  useEffect(() => {
    if (selectedFloorType === 'OpenPlot') {
      const openPlotCon = findOpenPlotConstructionTypeItem(props.constructionTypeData);
      if (openPlotCon) {
        const conId = String(openPlotCon.constructionTypeId ?? openPlotCon.id ?? '');
        const conDesc = String(openPlotCon.description || '');
        if (conId && (editingFloorForm.constructionTypeId !== conId || editingFloorForm.conTyp !== conDesc)) {
          setEditingFloorForm(prev => ({
            ...prev,
            constructionTypeId: conId,
            conTyp: conDesc,
            constructionTypeDescription: conDesc,
          }));
        }
      }

      // Auto-default floorId dynamically where FloorCode is 'op'
      if (isAddingNewFloor && !editingFloorForm.floorId) {
        const openPlotFloor = findOpenPlotFloorItem(props.floorData);
        if (openPlotFloor) {
          const floorIdVal = String(openPlotFloor.floorId ?? (openPlotFloor as Record<string, unknown>).id ?? '');
          const floorDesc = String(openPlotFloor.description || 'Open Plot');
          if (floorIdVal) {
            setEditingFloorForm(prev => ({
              ...prev,
              floorId: floorIdVal,
              floor: prev.floor || floorDesc,
              floorDescription: prev.floorDescription || floorDesc,
            }));
          }
        }
      }
    }
  }, [selectedFloorType, isAddingNewFloor, editingFloorForm.floorId, props.constructionTypeData, props.floorData, editingFloorForm.constructionTypeId, editingFloorForm.conTyp, setEditingFloorForm]);

  // Auto-population disabled to keep Open Space form blank on select/open
  /*
  useEffect(() => {
    if (!isAddingNewFloor) {
      hasAutoPopulatedOpenSpaceRef.current = false;
      return;
    }
    if (selectedFloorType === 'OpenPlot' && isAddingNewFloor) {
      if (hasAutoPopulatedOpenSpaceRef.current) return;
      const currentArea = parseFloat(String(editingFloorForm.areaSqM || '0')) || 0;
      const currentLen = parseFloat(String(editingFloorForm.length || '0')) || 0;
      if (currentArea === 0 && currentLen === 0 && availableRemainingOpenSpaceAreaSqM > 0) {
        setEditingFloorForm(prev => ({
          ...prev,
          length: String(availableRemainingOpenSpaceAreaSqM.toFixed(2)),
          width: '1.00',
          areaSqM: String(availableRemainingOpenSpaceAreaSqM.toFixed(2)),
          areaSqFt: String((availableRemainingOpenSpaceAreaSqM * 10.764).toFixed(2)),
        }));
        hasAutoPopulatedOpenSpaceRef.current = true;
      }
    }
  }, [selectedFloorType, isAddingNewFloor, availableRemainingOpenSpaceAreaSqM, setEditingFloorForm, editingFloorForm.areaSqM, editingFloorForm.length]);
  */

  // 2. URL and Navigation already initialized at the top of the hook

  // 3. Data Handlers (Save, Delete, etc.)
  const handlers = useFloorDataHandlers({
    props,
    editingFloorForm,
    selectedFloor,
    isAddingNewFloor,
    setIsAddingNewFloor,
    setSelectedFloor,
    setEditingFloorForm,
    localFloors,
    setLocalFloors,
    setFormErrors,
    validateForm: () => validateForm(editingFloorForm, t, selectedFloorType),
    startTransition,
    router,
    locale,
    propertyId,
    confirm: confirm,
    t: t,
    INITIAL_FORM_STATE: INITIAL_FORM_STATE as unknown as FloorData,
    selectedFloorType: selectedFloorType,
    resetRestoredSessionFormRef,
    updateUrlParams,
    // validation fields
    plotAreaSqM,
    isOpenSpaceAreaExceeded,
    isFloorAreaExceeded,
    availableRemainingOpenSpaceAreaSqM,
    availableRemainingConstructionAreaSqM,
    isGroundFloorAreaExceeded,
    isOpenSpaceNegative,
    totalOpenSpaceAreaSqM,
    totalConstructionAreaSqM,
    alreadyUtilizedOpenSpaceAreaSqM,
    enteredFloorAreaSqM,
    enteredOpenSpaceAreaSqM,
  });

  const { handleSave, handleDeleteFloor, handleOpenRenterManagement, isSaving, isDeleting } = handlers;

  // 4. Floor Actions (Add, Reset, Lazy Loading)
  const actions = useFloorActions({
    setEditingFloorForm,
    setFormErrors,
    setSelectedFloor,
    setShowRoomSubmission,
    setIsAddingNewFloor,
    updateUrlParams,
    searchParams,
    startTransition,
    INITIAL_FORM_STATE: INITIAL_FORM_STATE as unknown as FloorData,
    floorData: props.floorData,
  });

  const { handleOpenDropdown, resetForm, handleAddFloor } = actions;

  // Auto-trigger lazy loading of construction type data when switching to OpenPlot
  useEffect(() => {
    if (selectedFloorType === 'OpenPlot') {
      if (!props.constructionTypeData || props.constructionTypeData.length === 0) {
        handleOpenDropdown('loadConstruction');
      }
    }
  }, [selectedFloorType, props.constructionTypeData, handleOpenDropdown]);

  // useFloorSync already initialized at the top of the hook

  const [floorSearch, setFloorSearch] = useState('');

  const filteredFloors = useMemo(() => {
    const search = floorSearch.toLowerCase();
    return localFloors.filter((f) => {
      // Business Rule: Check only the isOpenPlot property for each record.
      // If isOpenPlot === true (or 'true' / 1 / IsOpenPlot), the record must not be displayed in the Floor Details table.
      const rawIsOpenPlot = f.isOpenPlot !== undefined ? f.isOpenPlot : (f as any).IsOpenPlot;
      const isOpenPlot = rawIsOpenPlot === true || String(rawIsOpenPlot).toLowerCase() === 'true' || rawIsOpenPlot === 1 || String(rawIsOpenPlot) === '1';

      if (isOpenPlot) {
        return false;
      }

      return (
        !search ||
        (f.floor || '').toLowerCase().includes(search) ||
        (f.conTyp || '').toLowerCase().includes(search) ||
        (f.use || '').toLowerCase().includes(search)
      );
    });
  }, [localFloors, floorSearch]);

  const subTypeOptionsFromData = useMemo(() =>
    (props.subTypeData || []).map(st => st.searchKey ? `${st.searchKey} - ${st.description}` : st.description),
    [props.subTypeData]
  );

  return {
    t,
    isOperationLoading: isSaving || isDeleting,
    setIsOperationLoading: () => { }, // Compatibility
    propertyId: props.initialPropertyID,
    floorSearch,
    setFloorSearch,
    filteredFloors,
    selectedFloor,
    setSelectedFloor,
    isAddingNewFloor,
    setIsAddingNewFloor,
    editingFloorForm,
    setEditingFloorForm,
    formErrors,
    setFormErrors,
    stagedRooms: editingFloorForm.roomWiseSubmissionDetails || [], // Derived for compatibility
    setStagedRooms: (val: unknown[]) => {
      setEditingFloorForm(prev => ({ ...prev, roomWiseSubmissionDetails: val }));
    }, // Compatibility setter
    showRoomSubmission,
    setShowRoomSubmission,
    subTypeOptionsFromData,
    roomsInputRef: formState.roomsInputRef,
    areaInputRef: formState.areaInputRef,
    // Handlers
    updateUrlParams,
    handleOpenDropdown,
    resetForm,
    handleAddFloor,
    handleOpenRenterManagement,
    handleDeleteFloor,
    handleSave,
    validateForm,
    startTransition,
    selectedFloorType,
    setSelectedFloorType: (type: 'Construction' | 'OpenPlot') => {
      setSelectedFloorTypeState(type);
      updateUrlParams({ drawer: type === 'OpenPlot' ? 'OpenPlot' : 'Construction' });
      hasAutoPopulatedOpenSpaceRef.current = false;
      if (selectedFloor) {
        const isPlot = isRecordOpenPlot(selectedFloor);
        const currentType = isPlot ? 'OpenPlot' : 'Construction';
        if (currentType !== type) {
          setSelectedFloor(null);
          setEditingFloorForm(INITIAL_FORM_STATE);
          setFormErrors({});
        }
      } else {
        setEditingFloorForm(INITIAL_FORM_STATE);
        setFormErrors({});
      }
    },
    isPlotCategory,
    // validation exports
    plotAreaSqM,
    setPlotAreaSqM,
    isAreaExceeded,
    isOpenSpaceAreaExceeded,
    isFloorAreaExceeded,
    totalConstructionAreaSqM,
    totalOpenSpaceAreaSqM,
    remainingAvailablePlotAreaSqM,
    availableRemainingOpenSpaceAreaSqM,
    availableRemainingConstructionAreaSqM,
    enteredFloorAreaSqM,
    alreadyUtilizedOpenSpaceAreaSqM,
    enteredOpenSpaceAreaSqM,
    totalUtilizedOpenSpaceAreaSqM: totalOpenSpaceAreaSqM,
    locale,
    router,
    localFloors,
  };
};
