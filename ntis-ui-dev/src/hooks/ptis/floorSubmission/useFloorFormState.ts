'use client';

import { useState, useCallback, useRef } from 'react';
import { FloorData } from '@/types/room-details.types';
import { validateFloorForm } from '@/lib/validations/validateFloorSubmission';

export const INITIAL_FORM_STATE: FloorData = {
  id: undefined,
  floor: '',
  floorId: '',
  subFloor: '',
  subFloorId: '',
  conYr: '',
  asstYr: '',
  conTyp: '',
  constructionTypeId: '',
  use: '',
  typeOfUseId: '',
  subTyp: '',
  subTypeOfUseId: '',
  subTypeOfUseDescription: '',
  renter: 'No',
  rooms: '0',
  areaSqFt: '',
  areaSqM: '',
  builtupAreaSqFt: '',
  builtupAreaSqM: '',
  isTaxable: 'Yes',
  agreementFromDate: null,
  agreementToDate: null,
  agreementDate: null,
  renterName: '',
  rentMonthly: '',
  rentYearly: '',
  renterNameEnglish: '',
  renterDetails: [],
  renterMast: [],
  occupancyDate: null,
  occupancyApplyOrNot: 'No',
  occupancyNumber: '',
  nonCalculateRentMonthly: 0,
  taxLiability: '',
  roomWiseSubmissionDetails: [],
  updateBuildingPermission: 'No',
};

export const useFloorFormState = () => {
  const [editingFloorForm, setEditingFloorForm] = useState<FloorData>(INITIAL_FORM_STATE);
  const [localFloors, setLocalFloors] = useState<FloorData[]>([]);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [isAddingNewFloor, setIsAddingNewFloor] = useState<boolean>(false);
  const [selectedFloor, setSelectedFloor] = useState<FloorData | null>(null);
  const [showRoomSubmission, setShowRoomSubmission] = useState(false);

  const roomsInputRef = useRef<HTMLInputElement>(null);
  const areaInputRef = useRef<HTMLInputElement>(null);

  const validateForm = useCallback(
    (formToValidate = editingFloorForm, t?: (key: string) => string, selectedFloorType?: 'Construction' | 'OpenPlot'): boolean => {
      const result = validateFloorForm(formToValidate, t, isAddingNewFloor, selectedFloorType);
      setFormErrors(result.errors);
      return result.isValid;
    },
    [editingFloorForm, isAddingNewFloor]
  );

  return {
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
    roomsInputRef,
    areaInputRef,
    validateForm,
  };
};
