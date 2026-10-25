/* eslint-disable @typescript-eslint/no-explicit-any */
import { toast } from 'sonner';

export function reconcileFloorSave(
  result: {
    floorDetailsId: number;
    childAssetId: number;
    childAssetNo?: string | undefined;
    childAssetName: string;
    determinedType: string;
    calculatedCV: any;
    resolvedRoomDetails: any[] | null;
    childPayload: any;
    subFloorLabel?: string;
    subUseTypeLabel?: string;
    deptName: string;
    parentDeptId: any;
    subUnitsDetailsId?: number;
    isDirectFloorSubmission?: boolean;
  },
  ctx: {
    formState: any;
    roomData: any[];
    openSpaceData: any[];
    editingId: number | null;
    setSavedFloors: React.Dispatch<React.SetStateAction<any[]>>;
    setEditingId: React.Dispatch<React.SetStateAction<number | null>>;
    t: any;
  }
) {
  const {
    floorDetailsId,
    childAssetId,
        childAssetName,
    determinedType,
    calculatedCV,
    resolvedRoomDetails,
    childPayload,
    subFloorLabel,
    subUseTypeLabel,
    deptName,
    parentDeptId,
    subUnitsDetailsId,
    isDirectFloorSubmission,
  } = result;
  const { formState, roomData, openSpaceData, editingId, setSavedFloors, setEditingId, t } = ctx;

  const enrichedChild = {
    id: childAssetId,
    subUnitsDetailsId: subUnitsDetailsId ?? childAssetId,
    isDirectFloorSubmission: isDirectFloorSubmission ?? true,
    floorDetailsId: floorDetailsId,
    floorId: childPayload.floorId,
    subFloorId: childPayload.subFloorId,
    subFloorName: subFloorLabel || '',
    unitNo: formState.unitNo || '',
    shopUnitName: isDirectFloorSubmission && (childAssetName === 'Room' || childAssetName === 'Floor' || !childAssetName) ? 'Construction' : childAssetName,
    unitType: isDirectFloorSubmission ? (determinedType === 'Open Space' ? 'Open Space' : 'Construction') : (determinedType === 'Floor' ? 'Construction' : determinedType),
    departmentId: parentDeptId ? Number(parentDeptId) : null,
    departmentName: deptName,
    constructionYear: formState.submissionType === 'Open Space' ? '' : formState.conYear,
    assessmentYear: formState.asstYear,
    constructionTypeId:
      formState.submissionType === 'Open Space' ? 11 : Number(formState.conType),
    typeOfUseId: Number(formState.useType),
    subTypeOfUseId:
      formState.subUseType && Number(formState.subUseType) > 0
        ? Number(formState.subUseType)
        : null,
    subTypeOfUseName:
      formState.subUseType && Number(formState.subUseType) > 0
        ? subUseTypeLabel || null
        : null,
    isRented: childPayload.isRented || formState.isRenter,
    renterNameEnglish: formState.isRenter ? formState.renterNameEnglish || '' : '',
    renterNameLocal: formState.isRenter ? formState.renterNameLocal || '' : '',
    tenantRegionalName: formState.isRenter ? formState.renterNameLocal || '' : '',
    tenantAddress: formState.isRenter ? formState.tenantAddress || '' : '',
    agreementId: formState.isRenter ? formState.agreementId || formState.agreementNo || '' : '',
    agreementNo: formState.isRenter ? formState.agreementNo || formState.agreementId || '' : '',
    agreementDate: formState.agreementDate || '',
    agreementFromDate: formState.agreementFromDate || '',
    agreementToDate: formState.agreementToDate || '',
    rentMonthly: formState.rentMonthly || '',
    rentYearly: formState.rentYearly || '',
    taxLiability: formState.taxLiability || '',
    rentType: formState.rentType || '',
    duration: formState.duration || '',
    rentFreq: formState.rentFreq || 'Monthly',
    securityDeposit: formState.securityDeposit || '',
    depositType: formState.depositType || 'Refundable',
    mobileNo: formState.mobileNo || '',
    emailId: formState.emailId || '',
    aadhaar: formState.aadhaar || '',
    pan: formState.pan || '',
    noOfRooms:
      formState.submissionType === 'Open Space'
        ? openSpaceData.reduce((acc, os) => acc + (os.count || 1), 0)
        : roomData.reduce((acc, r) => acc + (r.count || 1), 0),
    carpetAreaSqFeet: formState.carpetAreaSqFt,
    builtUpAreaSqFeet:
      formState.submissionType === 'Open Space'
        ? 0
        : (formState.builtUpAreaSqFt && Number(formState.builtUpAreaSqFt) > 0
            ? Number(formState.builtUpAreaSqFt)
            : (formState.carpetAreaSqFt ? Number((Number(formState.carpetAreaSqFt) * 1.2).toFixed(2)) : 0)),
    roomDetails: resolvedRoomDetails || [],
    rooms: resolvedRoomDetails || [],
    // NOTE: ASP.NET Core default JSON serialisation lowercases only the first char of each
    // segment, so C# `CVFloorFactor` → JSON `cVFloorFactor` (NOT `cvFloorFactor`).
    // All casing variants are listed so whichever the serialiser picks is covered.
    cvBaseRate: calculatedCV?.cVBaseRate ?? calculatedCV?.cvBaseRate ?? calculatedCV?.CVBaseRate ?? 0,
    baseValue: calculatedCV?.baseValue ?? calculatedCV?.BaseValue ?? 0,
    cvFloorFactor: calculatedCV?.cVFloorFactor ?? calculatedCV?.cvFloorFactor ?? calculatedCV?.CVFloorFactor ?? calculatedCV?.CvFloorFactor ?? 0,
    cvAgeFactor: calculatedCV?.cVAgeFactor ?? calculatedCV?.cvAgeFactor ?? calculatedCV?.CVAgeFactor ?? calculatedCV?.CvAgeFactor ?? 0,
    cvNatureFactor: calculatedCV?.cVNatureFactor ?? calculatedCV?.cvNatureFactor ?? calculatedCV?.CVNatureFactor ?? calculatedCV?.CvNatureFactor ?? 0,
    cvUseFactor: calculatedCV?.cVUseFactor ?? calculatedCV?.cvUseFactor ?? calculatedCV?.CVUseFactor ?? calculatedCV?.CvUseFactor ?? 0,
    capitalValue: calculatedCV?.capitalValue ?? calculatedCV?.CapitalValue ?? 0,
    // Distinguishes "not calculated / failed" from a legitimate ₹0, so the table doesn't
    // render a silent zero indistinguishable from a real result (see calculateSavedUnitCV).
    cvCalculated: calculatedCV ? calculatedCV.isCalculated !== false : false,
    cvCalculationMessage: calculatedCV?.calculationMessage || '',
  };

  if (editingId) {
    setSavedFloors((prev) => prev.map((f) => (f.id === editingId ? enrichedChild : f)));
    toast.success(t('floorDetails.updateSuccessMsg') || 'Floor details updated successfully.');
    setEditingId(null);
  } else {
    setSavedFloors((prev) => [...prev, enrichedChild]);
    toast.success(t('floorDetails.saveSuccessMsg') || 'Floor details saved successfully.');
  }

  return enrichedChild;
}
