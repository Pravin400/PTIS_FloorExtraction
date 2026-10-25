/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  createFloorSubmissionAction,
  updateFloorSubmissionAction,
} from '@/app/[locale]/assets/municipal-Asset/new-add-new-asset/floor-details/actions';

/**
 * Builds the Floor Submission payload from formState.
 * No childAssetId / bulkGenerate is required — we insert directly into SubUnitsDetails.
 */
function buildFloorSubmissionPayload(
  formState: any,
  built: { combinedData: any[]; roomDetails: any[] | null; floorIdNum: number; subFloorIdNum: number | null },
  _parentDeptId: any,
  formData: any
) {
  const { roomDetails, floorIdNum, subFloorIdNum } = built;

  const resolvedRoomDetails = roomDetails ? roomDetails.map((r: any) => ({ ...r })) : null;

  const payload: any = {
    parentAssetId: formData.id || 0,
    floorId: floorIdNum,
    subFloorId: subFloorIdNum,

    constructionTypeId:
      formState.submissionType === 'Open Space'
        ? 11
        : formState.conType
          ? Number(formState.conType)
          : null,
    typeOfUseId: formState.useType ? Number(formState.useType) : null,
    subTypeOfUseId:
      formState.subUseType && Number(formState.subUseType) > 0
        ? Number(formState.subUseType)
        : null,
    constructionYear:
      formState.submissionType === 'Open Space'
        ? null
        : formState.conYear
          ? String(formState.conYear)
          : null,
    assessmentYear: formState.asstYear ? String(formState.asstYear) : null,

    totalAreaSqFt: formState.carpetAreaSqFt || 0,
    carpetAreaSqFeet: formState.carpetAreaSqFt || 0,
    carpetAreaSqMeter: Number(((formState.carpetAreaSqFt || 0) / 10.7639).toFixed(4)),
    builtupAreaSqFeet:
      formState.submissionType === 'Open Space'
        ? 0
        : Number(((formState.carpetAreaSqFt || 0) * 1.2).toFixed(4)),
    builtupAreaSqMeter:
      formState.submissionType === 'Open Space'
        ? 0
        : Number((((formState.carpetAreaSqFt || 0) * 1.2) / 10.7639).toFixed(4)),

    noOfRooms: resolvedRoomDetails ? resolvedRoomDetails.length : 0,
    roomDetails: resolvedRoomDetails,

    isRenter: formState.isRenter || false,
    isRented: formState.isRenter || false,
    renterName: formState.isRenter ? formState.renterNameEnglish || null : null,
    renterNameLocal: formState.isRenter ? formState.renterNameLocal || null : null,
    tenantRegionalName: formState.isRenter ? formState.renterNameLocal || null : null,
    tenantAddress: formState.isRenter ? formState.tenantAddress || null : null,
    mobileNo: formState.isRenter ? formState.mobileNo || null : null,
    emailId: formState.isRenter ? formState.emailId || null : null,
    gstNo: formState.isRenter ? formState.gstNo || null : null,
    aadhaarCardNo: formState.isRenter ? formState.aadhaar || null : null,
    panCardNo: formState.isRenter ? formState.pan || null : null,
    agreementId: formState.isRenter ? formState.agreementId || formState.agreementNo || null : null,
    propertyDescription: formState.isRenter ? formState.propertyDescription || null : null,
    leaseRentType: formState.isRenter ? formState.rentType || 'Leased' : null,
    leaseType: formState.isRenter ? formState.rentType || 'Leased' : null,
    leaseStartDate: formState.isRenter ? formState.agreementFromDate || null : null,
    leaseEndDate: formState.isRenter ? formState.agreementToDate || null : null,
    rentFrequency: formState.isRenter ? formState.rentFreq || 'Monthly' : null,
    paymentFrequency: formState.isRenter ? formState.rentFreq || 'Monthly' : null,
    rentAmount: formState.isRenter ? Number(formState.rentMonthly || 0) : null,
    monthlyRent: formState.isRenter ? Number(formState.rentMonthly || 0) : null,
    securityDeposit: formState.isRenter ? Number(formState.securityDeposit || 0) : null,
    depositType: formState.isRenter ? formState.depositType || 'Refundable' : null,
    duration: formState.isRenter ? (formState.duration ? Number(formState.duration) : null) : null,
    rentInformation: formState.isRenter
      ? {
          agreementId: formState.agreementId || formState.agreementNo || null,
          leaseRentType: formState.rentType || 'Leased',
          leaseStart: formState.agreementFromDate || null,
          leaseEnd: formState.agreementToDate || null,
          rentFrequency: formState.rentFreq || 'Monthly',
          rentAmount: Number(formState.rentMonthly || 0),
          securityDeposit: Number(formState.securityDeposit || 0),
          depositType: formState.depositType || 'Refundable',
          tenantName: formState.renterNameEnglish || null,
          renterNameLocal: formState.renterNameLocal || null,
          tenantRegionalName: formState.renterNameLocal || null,
          tenantAddress: formState.tenantAddress || null,
        }
      : null,
  };

  return { payload, resolvedRoomDetails };
}

/**
 * Persists a Floor Submission directly to AMS.SubUnitsDetails with AssetId = parentAssetId.
 *
 * REPLACES the old persistChildAsset flow which:
 *   1. bulkGenerateSubUnitsAction  → created a child AssetMaster
 *   2. createChildAssetAction      → updated AssetMaster + inserted SubUnitsDetails
 *
 * NEW flow:
 *   1. createFloorSubmissionAction OR updateFloorSubmissionAction
 *      → inserts/updates SubUnitsDetails directly, no AssetMaster created.
 *
 * Returns an object shaped similarly to the old persistChildAsset return value
 * so the orchestrator (floor-save-orchestrator.utils.ts) requires minimal changes.
 */
export async function persistFloorSubmission(
  formState: any,
  built: { combinedData: any[]; roomDetails: any[] | null; floorIdNum: number; subFloorIdNum: number | null },
  _floorDetailsId: number,  // kept for signature compatibility; not sent to new endpoint
  _parentDeptId: any,
  editingSubUnitsDetailsId: number | null,   // subUnitsDetailsId when editing; null for new
  savedFloors: any[],
  formData: any
) {
  const { payload, resolvedRoomDetails } = buildFloorSubmissionPayload(
    formState,
    built,
    _parentDeptId,
    formData
  );

  // Determine a display name for the entry (used in reconcileFloorSave)
  const determinedType =
    formState.submissionType === 'Open Space'
      ? 'Open Space'
      : (formState.unitType && formState.unitType !== 'Room' && formState.unitType !== 'Floor' ? formState.unitType : 'Construction');

  const existing = editingSubUnitsDetailsId
    ? savedFloors.find((f) => f.subUnitsDetailsId === editingSubUnitsDetailsId || f.id === editingSubUnitsDetailsId)
    : null;

  const childAssetName = existing?.shopUnitName || (determinedType === 'Room' || determinedType === 'Floor' ? 'Construction' : determinedType);

  let floorRes: any;
  if (editingSubUnitsDetailsId) {
    floorRes = await updateFloorSubmissionAction(editingSubUnitsDetailsId, payload);
  } else {
    floorRes = await createFloorSubmissionAction(payload);
  }

  if (!floorRes.success || !floorRes.data) {
    throw new Error(floorRes.error || 'Failed to save floor submission.');
  }

  const responseData = floorRes.data as any;
  const innerData = responseData.items ?? responseData;

  // Normalise response — backend returns { subUnitsDetailsId, assetId, success, floorData, ... }
  const subUnitsDetailsId: number =
    innerData.subUnitsDetailsId ?? innerData.SubUnitsDetailsId ?? editingSubUnitsDetailsId ?? 0;
  const returnedAssetId: number =
    innerData.assetId ?? innerData.AssetId ?? formData.id ?? 0;
  const floorData = innerData.floorData ?? innerData.FloorData ?? null;

  // Shape the return value to mirror the old persistChildAsset output with enriched CV factors
  const childRes = {
    success: true,
    data: {
      subUnitsDetailsId,
      assetId: returnedAssetId,
      roomWiseSubmissionDetailsId: innerData.roomWiseSubmissionDetailsId ?? innerData.RoomWiseSubmissionDetailsId,
      floorData,
      cvFloorFactor: floorData?.cvFloorFactor ?? innerData.cvFloorFactor ?? innerData.CVFloorFactor ?? null,
      cvAgeFactor: floorData?.cvAgeFactor ?? innerData.cvAgeFactor ?? innerData.CVAgeFactor ?? null,
      cvNatureFactor: floorData?.cvNatureFactor ?? innerData.cvNatureFactor ?? innerData.CVNatureFactor ?? null,
      cvUseFactor: floorData?.cvUseFactor ?? innerData.cvUseFactor ?? innerData.CVUseFactor ?? null,
      cvBaseRate: floorData?.cvBaseRate ?? innerData.cvBaseRate ?? innerData.CVBaseRate ?? null,
      baseValue: floorData?.baseValue ?? innerData.baseValue ?? innerData.BaseValue ?? null,
      capitalValue: floorData?.capitalValue ?? innerData.capitalValue ?? innerData.CapitalValue ?? null,
    },
  };

  // Identity: use subUnitsDetailsId as the canonical stable id for this floor entry.
  // assetId = parentAssetId (no child AssetMaster was created).
  const identity = {
    childAssetId: subUnitsDetailsId,   // re-used as the floor entry's stable id
    childAssetNo: undefined as string | undefined,
    childAssetName,
    determinedType,
    subUnitsDetailsId,
    parentAssetId: returnedAssetId,
    isDirectFloorSubmission: true,
  };

  return { childRes, identity, childPayload: payload, resolvedRoomDetails };
}
