/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/exhaustive-deps */
'use client';

import { useCallback, useRef, useState } from 'react';
import { type AppRouterInstance } from 'next/dist/shared/lib/app-router-context.shared-runtime';
import { toast } from 'sonner';
import { FloorData } from '@/types/room-details.types';
import { FloorSubmissionPayload, EditSidebarProps } from '@/types/floor-details.types';
import { ConfirmOptions } from '@/components/common';
import { mapFormToPayload } from '@/lib/utils/floorSubmission/floor-mappers';
import { createOptimisticFloor, getOptimisticFloorsList, parseServerError } from '@/lib/utils/floorSubmission/floor-optimistic.utils';
import {
  submitFloorSubmissionNoRedirectAction,
  updateFloorSubmissionNoRedirectAction,
  deleteRenterDetailsAction,
  deleteRenterMastAction,
} from '@/app/[locale]/property-tax/ptis/QuickDataEntry/[propertyId]/FloorSubmission/actions';
import { useFloorDeletion } from './useFloorDeletion';
import { isPlotCategory as checkIsPlotCategory } from '@/lib/utils/ptis/category-helpers';
import { validateFloorCompleteSequence, extractFloorId } from '@/lib/validations/validateFloorSequence';
import { useQdeSaveTracker } from '@/hooks/ptis/QuickDataEntry/useQdeSaveTracker';

export const useFloorDataHandlers = (params: {
  props: EditSidebarProps;
  editingFloorForm: FloorData;
  selectedFloor: FloorData | null;
  isAddingNewFloor: boolean;
  setIsAddingNewFloor: (val: boolean) => void;
  setSelectedFloor: (val: FloorData | null) => void;
  setEditingFloorForm: (val: FloorData) => void;
  localFloors: FloorData[];
  setLocalFloors: (val: FloorData[]) => void;
  setFormErrors: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  validateForm: () => boolean;
  startTransition: React.TransitionStartFunction;
  router: AppRouterInstance;
  locale: string;
  propertyId: string;
  confirm: (payload: ConfirmOptions) => void;
  t: (key: string, values?: Record<string, string | number | Date>) => string;
  INITIAL_FORM_STATE: FloorData;
  selectedFloorType?: 'Construction' | 'OpenPlot';
  resetRestoredSessionFormRef?: () => void;
  updateUrlParams?: (params: Record<string, string | null>) => void;
  // Area validation fields
  plotAreaSqM?: number;
  isOpenSpaceAreaExceeded?: boolean;
  isFloorAreaExceeded?: boolean;
  availableRemainingOpenSpaceAreaSqM?: number;
  availableRemainingConstructionAreaSqM?: number;
  isGroundFloorAreaExceeded?: boolean;
  isOpenSpaceNegative?: boolean;
  totalOpenSpaceAreaSqM?: number;
  totalConstructionAreaSqM?: number;
  alreadyUtilizedOpenSpaceAreaSqM?: number;
  enteredFloorAreaSqM?: number;
  enteredOpenSpaceAreaSqM?: number;
}) => {
  const {
    props, editingFloorForm, selectedFloor, isAddingNewFloor,
    setIsAddingNewFloor, setSelectedFloor, setEditingFloorForm, localFloors, setLocalFloors, setFormErrors,
    startTransition,
    router, locale, propertyId, confirm, t, INITIAL_FORM_STATE, selectedFloorType,
    resetRestoredSessionFormRef, updateUrlParams,
    plotAreaSqM = 0,
    isOpenSpaceAreaExceeded = false,
    isFloorAreaExceeded = false,
    availableRemainingOpenSpaceAreaSqM = 0,
    availableRemainingConstructionAreaSqM = 0,
    isGroundFloorAreaExceeded = false,
    isOpenSpaceNegative = false,
    totalOpenSpaceAreaSqM = 0,
    totalConstructionAreaSqM = 0,
    alreadyUtilizedOpenSpaceAreaSqM = 0,
    enteredFloorAreaSqM = 0,
    enteredOpenSpaceAreaSqM = 0,
  } = params;

  const { floorData: floorLookup, constructionTypeData: constructionLookup } = props;

  // Separate loading states
  const [isSaving, setIsSaving] = useState(false);
  const isSavingRef = useRef(false);
  const { markChangesSaved } = useQdeSaveTracker(propertyId);

  // Use deletion hook
  const { handleDeleteFloor, isDeleting } = useFloorDeletion({
    localFloors,
    setLocalFloors,
    setSelectedFloor,
    setEditingFloorForm,
    router,
    startTransition,
    locale,
    propertyId,
    confirm,
    t,
    INITIAL_FORM_STATE,
  });


  const getSafeTranslation = useCallback((key: string, fallback: string, values?: Record<string, any>) => {
    try {
      const tFn = t as any;
      if (typeof tFn?.has === 'function' && tFn.has(key)) {
        const res = values ? t(key, values) : t(key);
        if (
          !res ||
          res.includes('quickDataEntry.') ||
          res.includes('DataEntry.') ||
          res.includes('floor.errors.') ||
          res.includes('floor.ok') ||
          res.startsWith('MISSING_MESSAGE') ||
          res.startsWith('FORMATTING_ERROR')
        ) {
          return fallback;
        }
        return res;
      }
      return fallback;
    } catch {
      return fallback;
    }
  }, [t]);

  const handleSave = useCallback(async () => {
    if (isSaving || isSavingRef.current) return;

    if (selectedFloorType === 'OpenPlot' && isOpenSpaceAreaExceeded) {
      const availArea = parseFloat(Number(availableRemainingOpenSpaceAreaSqM || 0).toFixed(2));
      const attemptedArea = parseFloat(Number(enteredOpenSpaceAreaSqM || 0).toFixed(2));
      const diffArea = parseFloat(Math.max(0, attemptedArea - availArea).toFixed(2));

      const headerMsg = getSafeTranslation('floor.openSpaceAreaExceeded', `Open Space Area cannot exceed the available remaining area (${availArea} Sq.M).`, { area: String(availArea) });
      const plotAreaLbl = getSafeTranslation('floor.plotAreaLabel', 'Plot Area:');
      const totalConLbl = getSafeTranslation('floor.totalConstructionAreaLabel', 'Total Construction Area:');
      const utilizedOpenLbl = getSafeTranslation('floor.alreadyUtilizedOpenSpaceAreaLabel', 'Already Utilized Open Space Area:');
      const attemptedOpenLbl = getSafeTranslation('floor.attemptedOpenSpaceAreaLabel', 'Attempted Open Space Area:');
      const remainingOpenLbl = getSafeTranslation('floor.remainingAreaForOpenSpaceLabel', 'Remaining Area for Open Space:');
      const exceededLbl = getSafeTranslation('floor.exceededAreaLabel', 'Exceeded Area (Difference):');
      const footerMsg = getSafeTranslation('floor.pleaseEnterOpenSpaceAreaLessThanRemaining', 'Please enter an Open Space area less than or equal to the remaining area.');

      const msg = `${headerMsg}\n\n${plotAreaLbl} ${parseFloat(Number(plotAreaSqM || 0).toFixed(2))} Sq M\n${totalConLbl} ${parseFloat(Number(totalConstructionAreaSqM || 0).toFixed(2))} Sq M\n${utilizedOpenLbl} ${parseFloat(Number(alreadyUtilizedOpenSpaceAreaSqM || 0).toFixed(2))} Sq M\n${attemptedOpenLbl} ${attemptedArea} Sq M\n${remainingOpenLbl} ${availArea} Sq M\n${exceededLbl} ${diffArea} Sq M\n\n${footerMsg}`;

      confirm({
        variant: 'warning',
        title: getSafeTranslation('floor.errors.areaExceededTitle', 'Plot Area Limit Exceeded'),
        description: msg,
        confirmText: getSafeTranslation('floor.ok', 'OK'),
        onConfirm: () => { },
      });
      return;
    }

    if (selectedFloorType === 'Construction' && isFloorAreaExceeded) {
      const availArea = parseFloat(Number(availableRemainingConstructionAreaSqM || 0).toFixed(2));
      const enteredArea = parseFloat(Number(enteredFloorAreaSqM || 0).toFixed(2));
      const diffArea = parseFloat(Math.max(0, enteredArea - availArea).toFixed(2));

      const headerMsg = getSafeTranslation('floor.floorAreaExceeded', `Floor Built-up Area cannot exceed the available remaining area (${availArea} Sq.M).`, { area: String(availArea) });
      const plotAreaLbl = getSafeTranslation('floor.plotAreaLabel', 'Plot Area:');
      const utilizedOpenLbl = getSafeTranslation('floor.alreadyUtilizedOpenSpaceAreaLabel', 'Already Utilized Open Space Area:');
      const enteredFloorLbl = getSafeTranslation('floor.enteredFloorBuiltupAreaLabel', 'Entered Floor Built-up Area:');
      const remainingLbl = getSafeTranslation('floor.remainingAreaLabel', 'Remaining Area:');
      const exceededLbl = getSafeTranslation('floor.exceededAreaLabel', 'Exceeded Area (Difference):');
      const footerMsg = getSafeTranslation('floor.pleaseEnterConstructionAreaLessThanRemaining', 'Please enter a Construction area less than or equal to the remaining area.');

      const msg = `${headerMsg}\n\n${plotAreaLbl} ${parseFloat(Number(plotAreaSqM || 0).toFixed(2))} Sq M\n${utilizedOpenLbl} ${parseFloat(Number(totalOpenSpaceAreaSqM || 0).toFixed(2))} Sq M\n${enteredFloorLbl} ${enteredArea} Sq M\n${remainingLbl} ${availArea} Sq M\n${exceededLbl} ${diffArea} Sq M\n\n${footerMsg}`;

      confirm({
        variant: 'warning',
        title: getSafeTranslation('floor.errors.areaExceededTitle', 'Plot Area Limit Exceeded'),
        description: msg,
        confirmText: getSafeTranslation('floor.ok', 'OK'),
        onConfirm: () => { },
      });
      return;
    }

    if (!selectedFloorType && isGroundFloorAreaExceeded) {
      const msg = getSafeTranslation('floor.groundFloorAreaExceeded', 'Total Ground Floor Construction Area cannot exceed Total Plot Area.');
      confirm({
        variant: 'warning',
        title: getSafeTranslation('floor.errors.areaExceededTitle', 'Plot Area Limit Exceeded'),
        description: msg,
        confirmText: getSafeTranslation('floor.ok', 'OK'),
        onConfirm: () => { },
      });
      return;
    }

    if (isOpenSpaceNegative) {
      const msg = getSafeTranslation('floor.openSpaceNegative', 'Open Space Area cannot be negative.');
      confirm({
        variant: 'warning',
        title: getSafeTranslation('floor.errors.areaExceededTitle', 'Plot Area Limit Exceeded'),
        description: msg,
        confirmText: getSafeTranslation('floor.ok', 'OK'),
        onConfirm: () => { },
      });
      return;
    }

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

    if (selectedFloorType === 'OpenPlot') {
      const openPlotCon = constructionLookup?.find(
        (c: any) =>
          String(c.constructionCode || '').toLowerCase() === 'op' ||
          String(c.description || '').toLowerCase() === 'open plot'
      );
      if (!openPlotCon) {
        setFormErrors((prev) => ({
          ...prev,
          constructionTypeId: t('floor.errors.openPlotConstructionTypeNotFound') || 'Construction Type for Open Plot not found in master data'
        }));
        toast.error(t('floor.errors.openPlotConstructionTypeNotFound') || 'Construction Type for Open Plot (op) not found in master data.');
        return;
      }
    }

    // Dynamic Runtime Validation: Floor Number vs Construction Year sequence check for current Property ID
    const targetFloorId = selectedFloor?.id ?? editingFloorForm.id;
    const candidateFloorId = isAddingNewFloor ? (editingFloorForm.id || Date.now()) : targetFloorId;
    const candidateFloor: FloorData = {
      ...editingFloorForm,
      constructionYear: editingFloorForm.conYr || editingFloorForm.constructionYear,
      propertyId,
      id: candidateFloorId,
    };

    const combinedFloorsForValidation = getOptimisticFloorsList(
      localFloors,
      candidateFloor,
      isAddingNewFloor
    );

    const completeSequenceValidation = validateFloorCompleteSequence(combinedFloorsForValidation, propertyId);
    let sequenceWarningMessage: string | null = null;

    if (!completeSequenceValidation.isValid) {
      const candidateExtractedId = extractFloorId(candidateFloor);
      const candidateIds = new Set<string>(
        [
          candidateExtractedId,
          candidateFloorId !== undefined && candidateFloorId !== null ? String(candidateFloorId) : '',
          candidateFloor.floor ? String(candidateFloor.floor) : '',
          candidateFloor.floorId ? String(candidateFloor.floorId) : '',
          candidateFloor.id ? String(candidateFloor.id) : '',
        ].filter(Boolean)
      );

      const candidateNumMismatch = completeSequenceValidation.numberMismatches.find(
        (m) => candidateIds.has(String(m.floorId))
      );

      const candidateYearMismatch = completeSequenceValidation.yearMismatches.find(
        (m) => candidateIds.has(String(m.floorId)) || candidateIds.has(String(m.previousFloorId))
      );

      if (candidateNumMismatch) {
        sequenceWarningMessage = candidateNumMismatch.message;
        setFormErrors((prev) => ({
          ...prev,
          floor: candidateNumMismatch.message,
        }));
      } else if (candidateYearMismatch) {
        sequenceWarningMessage = candidateYearMismatch.message;
        setFormErrors((prev) => ({
          ...prev,
          conYr: candidateYearMismatch.message,
        }));
      }
    }

    const proceedWithSaveConfirmation = () => {
      confirm({
        variant: isAddingNewFloor ? 'add' : 'update',
        title: isAddingNewFloor ? t('floor.addConfirmTitle') : t('floor.updateConfirmTitle'),
        description: isAddingNewFloor ? t('floor.addConfirmText') : t('floor.updateConfirmText'),
        confirmText: isAddingNewFloor ? t('floor.addConfirmButton') : t('floor.updateConfirmButton'),
        onConfirm: async () => {
        if (isSavingRef.current) return;
        isSavingRef.current = true;
        setIsSaving(true);
        const previousFloors = [...localFloors];
        try {
          const isPlotCategory = checkIsPlotCategory(props.initialPropertyData?.categoryName as string);
          const payload: FloorSubmissionPayload = mapFormToPayload({
            formData: editingFloorForm,
            floorLookup,
            subFloorLookup: props.subFloorData,
            constructionLookup,
            useLookup: props.useData,
            subTypeLookup: props.subTypeData,
            propertyId,
            isAddingNew: isAddingNewFloor,
            existingFloorId: selectedFloor?.id,
            selectedFloorType,
            isPlotCategory,
          });

          // Create optimistic floor object
          const optimisticFloor = createOptimisticFloor(
            editingFloorForm,
            isAddingNewFloor,
            selectedFloor?.id
          );

          // Optimistically update UI
          const updatedFloors = getOptimisticFloorsList(
            localFloors,
            optimisticFloor,
            isAddingNewFloor
          );
          setLocalFloors(updatedFloors);

          // Perform actual Server Action call
          const isEditing = !isAddingNewFloor && (selectedFloor?.id || editingFloorForm.id);
          const targetFloorId = selectedFloor?.id || editingFloorForm.id;
          const wasRenterActive = selectedFloor?.renter === 'Yes' || selectedFloor?.renterYesNo === true;
          const isRenterNowNo = editingFloorForm.renter === 'No' || editingFloorForm.renterYesNo === false;

          if (isEditing && wasRenterActive && isRenterNowNo) {
            try {
              let hasDeleted = false;
              if (selectedFloor?.renterDetails && selectedFloor.renterDetails.length > 0) {
                for (const item of selectedFloor.renterDetails) {
                  if (item.id && Number(item.id) > 0) {
                    await deleteRenterDetailsAction(item.id, locale, propertyId);
                    hasDeleted = true;
                  }
                }
              }
              if (selectedFloor?.renterMast && selectedFloor.renterMast.length > 0) {
                for (const item of selectedFloor.renterMast) {
                  if (item.id && Number(item.id) > 0) {
                    await deleteRenterMastAction(item.id, locale, propertyId);
                    hasDeleted = true;
                  }
                }
              }
              if (!hasDeleted && targetFloorId && Number(targetFloorId) > 0) {
                await deleteRenterDetailsAction(targetFloorId, locale, propertyId);
                await deleteRenterMastAction(targetFloorId, locale, propertyId);
              }
            } catch (_err) {
              // Best-effort cleanup before floor update
            }
          }

          const response = isEditing
            ? await updateFloorSubmissionNoRedirectAction(
              Number(selectedFloor?.id || editingFloorForm.id),
              payload,
              locale,
              propertyId
            )
            : await submitFloorSubmissionNoRedirectAction(payload, locale, propertyId);

          if (!response || !response.success) {
            setLocalFloors(previousFloors);
            const serverMsg = parseServerError(response?.error, t);
            toast.error(serverMsg);
            setIsSaving(false);
            isSavingRef.current = false;
            return;
          }

          toast.success(
            isAddingNewFloor
              ? t('floor.floorAddSuccess') || 'Floor added successfully'
              : t('floor.floorUpdateSuccess') || 'Floor updated successfully'
          );
          markChangesSaved();

          // Clear temporary renter session data & in-memory cached session form
          try {
            sessionStorage.removeItem('renter_data_new');
            if (selectedFloor?.id) {
              sessionStorage.removeItem(`renter_data_${selectedFloor.id}`);
            }
            sessionStorage.removeItem('editingFloorForm');
          } catch (_e) { }

          if (resetRestoredSessionFormRef) {
            resetRestoredSessionFormRef();
          }

          // Reset selection state and update URL silently inside transition
          startTransition(() => {
            setSelectedFloor(null);
            setIsAddingNewFloor(true);
            setEditingFloorForm(INITIAL_FORM_STATE);
            setFormErrors({});

            // Clear floorId from URL so page refresh does not attempt to reload saved floor
            if (updateUrlParams) {
              updateUrlParams({ floorId: null });
            }

            // Trigger quiet router refresh
            router.refresh();

            // Reset isSaving after transition completes
            setIsSaving(false);
            isSavingRef.current = false;
          });
        } catch (error) {
          setLocalFloors(previousFloors);
          const catchMsg = parseServerError(error, t);
          toast.error(catchMsg);
          setIsSaving(false);
          isSavingRef.current = false;
        }
      },
    });
  };

    if (sequenceWarningMessage) {
      confirm({
        variant: 'warning',
        title: getSafeTranslation('floor.sequenceWarningTitle', 'Floor Sequence Warning'),
        description: `${sequenceWarningMessage}\n\n${getSafeTranslation('floor.doYouWantToProceed', 'Do you want to proceed anyway?')}`,
        confirmText: getSafeTranslation('floor.proceedAnyway', 'Proceed Anyway'),
        cancelText: getSafeTranslation('common.cancel', getSafeTranslation('floor.cancel', 'Cancel')),
        onConfirm: () => {
          proceedWithSaveConfirmation();
        },
      });
      return;
    }

    proceedWithSaveConfirmation();
  }, [
    isSaving, selectedFloorType, isOpenSpaceAreaExceeded, isFloorAreaExceeded, isGroundFloorAreaExceeded, isOpenSpaceNegative,
    availableRemainingOpenSpaceAreaSqM, availableRemainingConstructionAreaSqM, plotAreaSqM, totalOpenSpaceAreaSqM, totalConstructionAreaSqM,
    alreadyUtilizedOpenSpaceAreaSqM, enteredFloorAreaSqM, enteredOpenSpaceAreaSqM, confirm, t, editingFloorForm, setFormErrors,
    constructionLookup, isAddingNewFloor, localFloors, props, floorLookup, selectedFloor, locale, propertyId, setLocalFloors,
    startTransition, setSelectedFloor, setIsAddingNewFloor, setEditingFloorForm, INITIAL_FORM_STATE, router, getSafeTranslation
  ]);

  const handleOpenRenterManagement = useCallback(async (formToUse?: FloorData) => {
    const currentForm = formToUse || editingFloorForm;
    if (!currentForm.floor) {
      setFormErrors((prev) => ({ ...prev, floor: t('floor.selectFloorFirst') || 'Please select floor first' }));
      toast.error(t('floor.selectFloorFirst') || 'Please select floor first');
      return;
    }

    try {
      sessionStorage.setItem('editingFloorForm', JSON.stringify(currentForm));
      sessionStorage.setItem('renter_return_focus', 'true');
    } catch {
      // Session staging is best-effort before navigating to renter screen.
    }

    const floorIdParam = currentForm.id ? String(currentForm.id) : 'new';
    const params = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    params.set('floorId', floorIdParam);
    if (selectedFloorType === 'OpenPlot' || currentForm.isOpenPlot || String(currentForm.floorId) === '77' || String(currentForm.floor) === '77') {
      params.set('drawer', 'OpenPlot');
    } else {
      params.set('drawer', currentForm.id ? 'edit' : 'add');
    }
    const renterManagementUrl = `/${locale}/property-tax/ptis/QuickDataEntry/${propertyId}/FloorSubmission/Renter?${params.toString()}`;
    router.push(renterManagementUrl);
  }, [editingFloorForm, t, setFormErrors, router, locale, propertyId, selectedFloorType]);


  return {
    handleSave,
    handleDeleteFloor,
    handleOpenRenterManagement,
    isSaving,
    isDeleting,
  };
};