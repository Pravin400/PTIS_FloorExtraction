/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner';

export function useSubUnitSave(
  formData: any,
  roomsList: any[],
  openSpacesList: any[],
  area: number,
  submissionType: 'Construction' | 'Open Space',
  stagedFiles: Record<string, File[]>,
  suppressToast: boolean,
  t: any,
  onSave: (updatedUnit: any, options?: { isDuplicateMode?: boolean }) => void,
  isDuplicateFloorMode?: boolean,
  duplicateEntries?: any[]
) {
  const handleSaveClick = async () => {
    // 2. Validation Checks: if floors were added, derive carpet area from duplicateEntries
    const totalDuplicateArea = Array.isArray(duplicateEntries)
      ? duplicateEntries.reduce((acc, e) => acc + (Number(e.carpetAreaSqFeet) || 0), 0)
      : 0;
    const effectiveArea = area > 0 ? area : totalDuplicateArea;

    if (!effectiveArea || Number(effectiveArea) <= 0) {
      toast.error(t('subunit.validation.areaRequired'));
      return;
    }

    if (formData.mobileNo && formData.mobileNo.length !== 10) {
      toast.error(t('subunit.validation.mobileLength'));
      return;
    }

    if (formData.emailId) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.emailId)) {
        toast.error(t('subunit.validation.emailInvalid'));
        return;
      }
    }

    if (formData.renterName) {
      if (formData.renterName.startsWith(' ')) {
        toast.error(t('subunit.validation.renterSpace'));
        return;
      }
      if (!/^[A-Za-z][A-Za-z\s]*$/.test(formData.renterName)) {
        toast.error(t('subunit.validation.renterInvalid'));
        return;
      }
    }

    if (formData.aadhaar) {
      if (!/^[0-9]{12}$/.test(formData.aadhaar)) {
        toast.error(t('subunit.validation.aadhaarLength'));
        return;
      }
    }

    if (formData.pan) {
      const panUpper = formData.pan.toUpperCase();
      if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(panUpper)) {
        toast.error(t('subunit.validation.panInvalid'));
        return;
      }
    }

    if (formData.gstNo) {
      const gstUpper = formData.gstNo.toUpperCase();
      if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(gstUpper)) {
        toast.error(t('subunit.validation.gstInvalid'));
        return;
      }
    }

    const alphaNumRegex = /^[A-Za-z0-9\s/-]+$/;
    if (formData.propertyNo && !alphaNumRegex.test(formData.propertyNo)) {
      toast.error(t('subunit.validation.propertyNoInvalid'));
      return;
    }
    if (formData.partitionNo && !alphaNumRegex.test(formData.partitionNo)) {
      toast.error(t('subunit.validation.partitionNoInvalid'));
      return;
    }
    if (formData.surveyNo && !alphaNumRegex.test(formData.surveyNo)) {
      toast.error(t('subunit.validation.csnInvalid'));
      return;
    }
  

    if (formData.isRenter || formData.rentType) {
      if (!formData.rentType) {
        toast.error(t?.has?.('subunit.validation.rentTypeRequired') ? t('subunit.validation.rentTypeRequired') : 'Lease / Rent Type is required when Renter is Yes');
        return;
      }
      if (!formData.renterName || !formData.renterName.trim()) {
        toast.error(t('subunit.validation.renterRequired'));
        return;
      }
      if (!formData.mobileNo || !formData.mobileNo.trim()) {
        toast.error(t('subunit.validation.mobileRequired'));
        return;
      }
      if (!formData.leaseStart) {
        toast.error(t('subunit.validation.leaseStartRequired'));
        return;
      }
      if (!formData.leaseEnd) {
        toast.error(t('subunit.validation.leaseEndRequired'));
        return;
      }
      const start = new Date(formData.leaseStart);
      const end = new Date(formData.leaseEnd);
      if (start >= end) {
        toast.error(t('subunit.validation.leaseEndAfterStart'));
        return;
      }
      if (!formData.rentAmount || Number(formData.rentAmount) <= 0) {
        toast.error(t('subunit.validation.rentAmountMin'));
        return;
      }
    }

    const loadingToast = suppressToast ? null : toast.loading(t?.has?.('subunit.toasts.saving') ? t('subunit.toasts.saving') : 'Saving unit details...');
    try {
      // If form was cleared for fresh start, preserve primary entry's floor details & rooms for unit-level state
      const primaryEntry = Array.isArray(duplicateEntries) && duplicateEntries.length > 0 ? duplicateEntries[0] : null;

      const effectiveRooms = roomsList.length > 0
        ? roomsList
        : (primaryEntry ? primaryEntry.rooms || [] : []);

      const effectiveOpenSpaces = openSpacesList.length > 0
        ? openSpacesList
        : (primaryEntry ? primaryEntry.openSpacesList || [] : []);

      const combinedRooms = [
        ...effectiveRooms.map((r: any) => ({
          ...r,
          ...(isDuplicateFloorMode ? { id: undefined } : {}),
          submissionType: r.submissionType || 'Room',
          offsets: Array.isArray(r.offsets)
            ? r.offsets.map((off: any) => ({
                ...off,
                ...(isDuplicateFloorMode ? { id: undefined } : {}),
              }))
            : [],
        })),
        ...effectiveOpenSpaces.map((os: any) => ({
          ...os,
          ...(isDuplicateFloorMode ? { id: undefined } : {}),
          submissionType: 'Open Space',
          roomType: 'Open Space',
          lengthMtr: os.length ? Number(os.length) : null,
          widthMtr: os.width ? Number(os.width) : null,
          heightMtr: os.height ? Number(os.height) : null,
          base1Mtr: os.base1 ? Number(os.base1) : null,
          base2Mtr: os.base2 ? Number(os.base2) : null,
          radiusMtr: os.radius ? Number(os.radius) : null,
          areaSqMtr: os.areaSqM ? Number(os.areaSqM) : null,
          totalAreaSqMtr: os.netAreaSqM ? Number(os.netAreaSqM) * Number(os.count || 1) : null,
          noOfRooms: Number(os.count || 1),
        })),
      ];

      // ── ROOM AUTO-DELETE FIX ─────────────────────────────────────────────────
      // When floor-submission entries (duplicateEntries) are present, rooms are
      // already persisted via the dedicated floor-submission API endpoints
      // (createFloorSubmissionAction / updateFloorSubmissionAction).
      // Passing any rooms array here would cause the backend to synchronize
      // (i.e. delete) rooms that are absent from the payload, silently removing
      // rooms belonging to OTHER floor entries.
      //
      // Rule: Save Unit must NEVER delete rooms. Rooms are only deleted when
      // the user explicitly clicks the room delete action.
      //
      // Therefore: when floor-submission entries exist, pass rooms: null so that
      // buildUnitDetailChildPayload produces roomDetails: null and omits the
      // roomDetails field from the API request entirely. The backend then
      // leaves ALL existing RoomWiseSubmissionsDetails rows untouched.
      const roomsForSave = Array.isArray(duplicateEntries) && duplicateEntries.length > 0
        ? null   // floor-submission mode: do NOT send rooms — backend must not touch them
        : combinedRooms;
      // ────────────────────────────────────────────────────────────────────────

      const hasStagedPhotos = Boolean(stagedFiles && Object.keys(stagedFiles).length > 0);

      onSave(
        {
          ...formData,
          subFloorId: formData.subFloorId || primaryEntry?.subFloorId || null,
          subFloorName: formData.subFloorName || primaryEntry?.subFloorName || null,
          conYear: (submissionType === 'Construction' ? formData.conYear : null) || primaryEntry?.conYear || null,
          conType: (submissionType === 'Construction' ? formData.conType : null) || primaryEntry?.conType || null,
          rooms: roomsForSave,
          carpetAreaSqFeet: effectiveArea,
          capitalValue: Number(formData.capitalValue || 0),
          departmentId: formData.departmentId ? Number(formData.departmentId) : null,
          departmentName: formData.departmentName || null,
          locationAddress: formData.locationAddress || null,
          locationLat: formData.locationLat || null,
          locationLng: formData.locationLng || null,
          photoFile: hasStagedPhotos ? null : (stagedFiles?.['PROPERTY_PHOTO']?.[0] || stagedFiles?.['PROPERTY']?.[0] || null),
          planFile: hasStagedPhotos ? null : (stagedFiles?.['PHOTO_PLAN']?.[0] || stagedFiles?.['PLAN']?.[0] || null),
          stagedFiles,
        },
        { isDuplicateMode: isDuplicateFloorMode }
      );
      if (!suppressToast && loadingToast) {
        toast.success(t?.has?.('subunit.toasts.success') ? t('subunit.toasts.success') : 'Unit configured successfully', { id: loadingToast });
      }
    } catch (err: any) {
      if (!suppressToast && loadingToast) {
        toast.error(err.message || (t?.has?.('subunit.toasts.failed') ? t('subunit.toasts.failed') : 'Failed to configure unit'), { id: loadingToast });
      }
    }
  };

  return { handleSaveClick };
}
