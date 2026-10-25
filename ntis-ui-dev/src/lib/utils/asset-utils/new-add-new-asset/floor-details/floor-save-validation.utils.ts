/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner';

export function validateFloorForm(
  formState: any,
  roomData: any[],
  openSpaceData: any[],
  amenityData: any[],
  t: any,
  options?: { isDuplicateFloorMode?: boolean; savedFloors?: any[] }
): boolean {
  if (
    (!roomData || roomData.length === 0) &&
    (!openSpaceData || openSpaceData.length === 0) &&
    (!amenityData || amenityData.length === 0)
  ) {
    toast.error(
      t('floorDetails.roomRequiredMsg') ||
      'Please add at least one room, open space or amenity before adding the floor'
    );
    return false;
  }
  if (formState.submissionType !== 'Open Space') {
    if (!formState.floor) {
      toast.error(t('floorDetails.floorRequiredMsg') || 'Please select Floor');
      return false;
    }
  }
  if (formState.submissionType !== 'Open Space') {
    if (!formState.conYear) {
      toast.error(t('floorDetails.conYrRequiredMsg') || 'Please enter Construction Year');
      return false;
    }
  }
  if (!formState.asstYear) {
    toast.error(
      t.has('floorDetails.asstYrRequiredMsg')
        ? t('floorDetails.asstYrRequiredMsg')
        : 'Please enter Assessment Year'
    );
    return false;
  }
  if (
    formState.submissionType !== 'Open Space' &&
    formState.conYear &&
    Number(formState.asstYear) < Number(formState.conYear)
  ) {
    toast.error(
      t.has('floorDetails.asstYrValidationMessage')
        ? t('floorDetails.asstYrValidationMessage', {
          asstYr: formState.asstYear,
          conYr: formState.conYear,
        })
        : `Assessment Year (${formState.asstYear}) cannot be less than Construction Year (${formState.conYear})`
    );
    return false;
  }
  if (formState.submissionType !== 'Open Space') {
    if (!formState.conType) {
      toast.error(t('floorDetails.conTypeRequiredMsg') || 'Please select Construction Type');
      return false;
    }
  }
  if (!formState.useType) {
    toast.error(t('floorDetails.useTypeRequiredMsg') || 'Please select Type of Use');
    return false;
  }
  if (formState.isRenter && (!formState.renterNameEnglish || formState.renterNameEnglish.trim() === '')) {
    toast.error(
      t.has('floorDetails.renterNameRequiredMsg')
        ? t('floorDetails.renterNameRequiredMsg')
        : 'Please open the Renter form and provide the Renter Name, or set Renter to No.'
    );
    return false;
  }

  if (options?.isDuplicateFloorMode) {
    // Sub floor is optional in duplicate mode.
    // If a subFloor is specified, verify it does not collide with an existing saved floor with the same floor and subfloor.
    if (formState.subFloor && String(formState.subFloor).trim() !== '' && options?.savedFloors && Array.isArray(options.savedFloors)) {
      const exists = options.savedFloors.some(
        (f: any) =>
          String(f.floorId) === String(formState.floor) &&
          String(f.subFloorId || '') === String(formState.subFloor)
      );
      if (exists) {
        toast.error(
          t.has('floorDetails.duplicateFloorCombinationMsg')
            ? t('floorDetails.duplicateFloorCombinationMsg')
            : 'A floor with this Floor and Sub Floor combination already exists. Please select a different Sub Floor.'
        );
        return false;
      }
    }
  }

  return true;
}
